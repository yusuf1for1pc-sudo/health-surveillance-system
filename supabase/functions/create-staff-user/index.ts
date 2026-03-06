import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing authorization header. Please pass a Bearer token." }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) {
            return new Response(JSON.stringify({ error: "Token is empty." }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Verify the calling user is an org_admin
        const userClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!
        );

        const { data: { user: callerUser }, error: authError } = await userClient.auth.getUser(token);
        if (authError || !callerUser) {
            console.error("Auth error:", authError);
            return new Response(JSON.stringify({ error: "Unauthorized: " + (authError?.message || "No user found") }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const callerRole = callerUser.user_metadata?.role;
        let callerOrgId = callerUser.user_metadata?.organization_id;

        // If organization_id is not in user_metadata, fetch it from profiles
        if (!callerOrgId) {
            const { data: profile } = await userClient
                .from('profiles')
                .select('organization_id')
                .eq('id', callerUser.id)
                .single();
            callerOrgId = profile?.organization_id;
        }

        if (callerRole !== "org_admin" && callerRole !== "platform_admin") {
            return new Response(JSON.stringify({ error: "Only org admins can create staff" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Parse request body
        const { email, password, full_name, phone, staff_type } = await req.json();

        if (!email || !password || !full_name) {
            return new Response(JSON.stringify({ error: "Email, password, and full name are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const role = staff_type === "lab" ? "lab_staff" : "doctor";

        // Use service role to create the user (no session switch)
        const adminClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role,
                phone,
                organization_id: callerOrgId,
            },
        });

        if (createError) {
            console.error("Create user error details:", createError);
            return new Response(JSON.stringify({
                error: createError.message,
                details: createError
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Ensure profile has organization_id
        if (newUser?.user?.id && callerOrgId) {
            await adminClient
                .from("profiles")
                .upsert({
                    id: newUser.user.id,
                    email,
                    full_name,
                    role,
                    phone,
                    organization_id: callerOrgId,
                });
        }

        return new Response(
            JSON.stringify({ success: true, user_id: newUser?.user?.id, email }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

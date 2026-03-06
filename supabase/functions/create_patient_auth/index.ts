import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { phone, fullName, organizationId } = await req.json();

        if (!phone || !fullName || !organizationId) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
            phone: phone,
            phone_confirm: true,
            user_metadata: { full_name: fullName },
        });

        if (authError) {
            if (authError.message.includes("already been registered") || authError.status === 422) {
                return new Response(
                    JSON.stringify({ error: "Phone number already registered" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
                );
            }
            throw authError;
        }

        const userId = authData.user.id;

        const { error: profileError } = await supabaseClient
            .from("profiles")
            .insert({
                id: userId,
                full_name: fullName,
                role: "patient",
                organization_id: organizationId,
            });

        if (profileError) {
            throw profileError;
        }

        return new Response(
            JSON.stringify({ user_id: userId, message: "Patient auth created successfully" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

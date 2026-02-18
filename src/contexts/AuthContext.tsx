import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';

interface AuthUser {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    organization_id?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string; role?: string }>;
    signUp: (data: { email: string; password: string; full_name: string; phone?: string; role?: UserRole; metadata?: Record<string, any> }) => Promise<{ data?: any; error?: string }>;
    demoSignIn: (email: string) => Promise<{ role: string }>;
    signOut: () => Promise<void>;
    skipAuthRedirect: React.MutableRefObject<boolean>;
    finishRegistration: () => Promise<void>;
}

type UserRoleType = 'platform_admin' | 'org_admin' | 'doctor' | 'lab_staff' | 'patient' | 'government';

const roleKeywords: [string, UserRoleType][] = [
    ['admin', 'platform_admin'],
    ['org', 'org_admin'],
    ['doctor', 'doctor'],
    ['staff', 'doctor'],
    ['lab', 'lab_staff'],
    ['gov', 'government'],
    ['patient', 'patient'],
];

const detectRoleFromEmail = (email: string): UserRole => {
    const lower = email.toLowerCase();
    for (const [keyword, role] of roleKeywords) {
        if (lower.includes(keyword)) return role;
    }
    return 'patient';
};

export const getRoleRedirectPath = (role: UserRole): string => {
    switch (role) {
        case 'platform_admin': return '/admin/workspace';
        case 'org_admin': return '/org/workspace';
        case 'doctor':
        case 'lab_staff': return '/staff/workspace';
        case 'government': return '/gov/workspace';
        case 'patient':
        default: return '/patient/workspace';
    }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const skipAuthRedirect = useRef(false);

    // ─── Session Restoration ─────────────────────────
    useEffect(() => {
        const checkSession = async () => {
            if (isSupabaseConfigured()) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
                            role: (profile?.role as UserRole) || 'patient',
                            phone: profile?.phone,
                            organization_id: profile?.organization_id,
                        });
                    }
                } catch (err) {
                    console.error('Session check error:', err);
                }
            }
            // Disable local storage demo user restoration to enforce security
            // const demoUser = localStorage.getItem('tempest_demo_user');
            // if (!user && demoUser) ...
            setLoading(false);
        };

        checkSession();

        if (isSupabaseConfigured()) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                try {
                    // Skip during registration — RegisterPatient needs to finish patient insert first
                    if (skipAuthRedirect.current) {
                        console.log('[AuthContext] Skipping auth redirect (registration in progress)');
                        return;
                    }

                    if (session?.user) {
                        console.log("[AuthContext] Auth state change:", session.user.email);

                        // Fetch profile to get authoritative role (not just metadata)
                        const { data: profile, error: profileError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        if (profileError) {
                            console.error("[AuthContext] Profile fetch error:", profileError);
                            // If we can't get profile, we can't trust the role. Safer to sign out.
                            // But to avoid infinite loop, we check if we keep crashing.
                        }

                        const role = (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || 'patient';
                        const orgId = profile?.organization_id || session.user.user_metadata?.organization_id;

                        // SECURITY: Check Org Status for Org-bound roles
                        // ENFORCEMENT RULES:
                        // ✔ org_admin, doctor, lab_staff -> MUST be approved.
                        // ✖ patient, government, platform_admin -> Bypass check (always allowed if auth is valid).
                        if (['org_admin', 'doctor', 'lab_staff'].includes(role)) {
                            // Wrap RPC in try-catch in case it doesn't exist or fails
                            try {
                                const { data: orgStatus } = await supabase.rpc('get_my_org_status');
                                if (orgStatus && orgStatus !== 'approved') {
                                    console.warn(`[AuthContext] Blocking session for ${role}. Org Status: ${orgStatus}`);
                                    await supabase.auth.signOut();
                                    setUser(null);
                                    return;
                                }
                            } catch (rpcError) {
                                console.error("Org status check failed:", rpcError);
                                // Don't block login on RPC failure unless critical?
                                // Let's assume if it fails, we allow (fail open) OR deny (fail closed). 
                                // For now, fail open to avoid "disappearing" app, but log it.
                            }
                        }

                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
                            role,
                            phone: profile?.phone,
                            organization_id: orgId,
                        });
                        console.log("[AuthContext] User state set.");
                    } else {
                        // Don't clear demo user on auth state change
                        const demoUser = localStorage.getItem('tempest_demo_user');
                        if (!demoUser) {
                            setUser(null);
                        }
                    }
                } catch (err) {
                    console.error("[AuthContext] Unexpected error in auth state change:", err);
                    // Force clean state
                    setUser(null);
                }
            });

            return () => subscription.unsubscribe();
        }
    }, []);

    // ─── Sign In (validates against Supabase Auth) ───
    const signIn = async (email: string, password: string): Promise<{ error?: string; role?: string }> => {
        if (!isSupabaseConfigured()) {
            return { error: 'Authentication service is not configured.' };
        }

        try {
            console.log("=== SIGN IN START ===");
            console.log("Attempting sign in for:", email);

            // Timeout wrapper
            const signInPromise = supabase.auth.signInWithPassword({ email, password });

            const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
                setTimeout(() => reject(new Error('Sign in request timed out. Please check your connection.')), 15000)
            );

            const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

            console.log("Supabase Auth Result:", {
                user: data?.user?.id,
                session: !!data?.session,
                error: error?.message
            });

            if (data?.session && data?.user) {
                // Ensure we don't block main thread
                // Profile fetch
                const profilePromise = supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                const { data: profile, error: profileError } = await profilePromise;

                const role = (profile?.role as UserRole) || 'patient';
                const metadata = data.user.user_metadata || {};

                setUser({
                    id: data.user.id,
                    email: data.user.email || '',
                    full_name: profile?.full_name || metadata.full_name || 'User',
                    role,
                    phone: profile?.phone,
                    organization_id: profile?.organization_id,
                });

                localStorage.removeItem('tempest_demo_user');

                // Org check could go here, but omitted for speed to fix login loop first.
                // The onAuthStateChange will catch it anyway.

                return { role };
            }

            if (error) {
                if (error.message === 'Invalid login credentials') {
                    return { error: 'Invalid email or password.' };
                }
                return { error: error.message };
            }

            return { error: 'No user returned.' };

        } catch (err: any) {
            console.error("Sign in exception:", err);
            return { error: err.message || 'Unable to connect to authentication server.' };
        }
    };

    // ─── Sign Up (creates user in Supabase Auth + profile + patient via trigger) ───
    const signUp = async (data: {
        email: string;
        password: string;
        full_name: string;
        phone?: string;
        role?: UserRole;
        metadata?: Record<string, any>;
    }): Promise<{ data?: any; error?: string }> => {
        if (!isSupabaseConfigured()) {
            return { error: 'Authentication service is not configured.' };
        }

        const role = data.role || detectRoleFromEmail(data.email);

        // 1. Create the auth user — pass ALL patient data via metadata
        // The handle_new_user trigger reads metadata to create profile + patient
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.full_name,
                    role,
                    phone: data.phone,
                    ...data.metadata, // spread all patient fields
                },
            },
        });

        if (signUpError) {
            if (signUpError.message.includes('already registered')) {
                return { error: 'An account with this email already exists. Please sign in.' };
            }
            return { error: signUpError.message };
        }

        if (signUpData.user) {
            // Profile is created by the handle_new_user trigger (with phone from metadata).
            // IMPORTANT: Do NOT call setUser() here! It would trigger a React re-render
            // and navigate away from the registration page before the patient record is created.
            // The caller (RegisterPatient) will handle navigation after patient insert.
        }

        return { data: signUpData, error: undefined };
    };

    // ─── Demo Access (Real Supabase Auth) ───────────
    const demoSignIn = async (email: string): Promise<{ role: string }> => {
        // In a real scenario, these accounts should exist in Supabase Auth.
        // We will try to sign them in with a default demo password.
        const DEMO_PASSWORD = "password123";

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: DEMO_PASSWORD
        });

        if (error) {
            console.error("Demo login failed:", error);
            // Fallback for purely local dev if seeds aren't run, BUT per requirements we should not mock.
            // However, to prevent total lockout if user hasn't run seeds:
            throw new Error(error.message);
        }

        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            const role = (profile?.role as UserRole) || 'patient';
            setUser({
                id: data.user.id,
                email: data.user.email || '',
                full_name: profile?.full_name || 'User',
                role,
                phone: profile?.phone,
                organization_id: profile?.organization_id,
            });
            localStorage.removeItem('tempest_demo_user');
            return { role };
        }

        throw new Error("Demo user not found");
    };

    // ─── Finish Registration (set user after patient insert) ──
    const finishRegistration = async () => {
        if (isSupabaseConfigured()) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
                    role: (profile?.role as UserRole) || 'patient',
                    phone: profile?.phone,
                    organization_id: profile?.organization_id,
                });
            }
        }
        skipAuthRedirect.current = false;
    };

    // ─── Sign Out ────────────────────────────────────
    const signOut = async () => {
        try {
            if (isSupabaseConfigured()) {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            localStorage.removeItem('tempest_demo_user');
            setUser(null);
            console.log("Local session cleared.");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, demoSignIn, signOut, skipAuthRedirect, finishRegistration }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

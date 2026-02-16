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
                // Skip during registration — RegisterPatient needs to finish patient insert first
                if (skipAuthRedirect.current) {
                    console.log('[AuthContext] Skipping auth redirect (registration in progress)');
                    return;
                }
                if (session?.user) {
                    console.log("[AuthContext] Auth state change:", session.user.email);
                    const metadata = session.user.user_metadata || {};

                    // Use metadata to populate user state (avoids DB query deadlock during init)
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: metadata.full_name || 'User',
                        role: (metadata.role as UserRole) || 'patient',
                        phone: metadata.phone,
                        organization_id: metadata.organization_id, // Metadata might be null for older users, but critical for avoiding hang
                    });
                    // Log success
                    console.log("[AuthContext] User state set from metadata.");
                } else {
                    // Don't clear demo user on auth state change
                    const demoUser = localStorage.getItem('tempest_demo_user');
                    if (!demoUser) {
                        setUser(null);
                    }
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

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            console.log("Supabase Auth Result:", {
                user: data?.user?.id,
                session: !!data?.session,
                error: error?.message
            });

            if (data.session && data.user) {
                const metadata = data.user.user_metadata || {};
                setUser({
                    id: data.user.id,
                    email: data.user.email || '',
                    full_name: metadata.full_name || 'User',
                    role: (metadata.role as UserRole) || 'patient',
                    phone: metadata.phone,
                    organization_id: metadata.organization_id,
                });
            }

            if (error) {
                // Map Supabase errors to user-friendly messages
                if (error.message === 'Invalid login credentials') {
                    return { error: 'Invalid email or password. Please check your credentials or register first.' };
                }
                return { error: error.message };
            }

            if (data.user) {
                console.log("Fetching profile for:", data.user.id);

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                console.log("Profile Fetch Result:", {
                    found: !!profile,
                    role: profile?.role,
                    error: profileError?.message
                });

                const role = (profile?.role as UserRole) || 'patient';

                console.log("Setting user context...");

                setUser({
                    id: data.user.id,
                    email: data.user.email || '',
                    full_name: profile?.full_name || 'User',
                    role,
                    phone: profile?.phone,
                    organization_id: profile?.organization_id,
                });
                localStorage.removeItem('tempest_demo_user');

                console.log("Sign in complete, returning role:", role);
                return { role };
            }

            console.warn("Sign in successful but no user/session returned.");
        } catch (err) {
            console.error("Sign in exception:", err);
            return { error: 'Unable to connect to authentication server.' };
        }
        return { error: 'An unexpected error occurred.' };
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
        if (isSupabaseConfigured()) {
            await supabase.auth.signOut().catch(() => { });
        }
        localStorage.removeItem('tempest_demo_user');
        setUser(null);
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

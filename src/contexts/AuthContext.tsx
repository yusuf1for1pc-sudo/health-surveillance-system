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
    const profileCache = useRef<{ role?: UserRole; organization_id?: string; full_name?: string; phone?: string }>({});

    // ─── Session Restoration ─────────────────────────
    useEffect(() => {
        let loadingTimeout: ReturnType<typeof setTimeout>;

        const checkSession = async () => {
            if (isSupabaseConfigured()) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        localStorage.removeItem('tempest_demo_user');

                        // Fetch profile — if it fails, onAuthStateChange already set user from JWT
                        let profile: any = null;
                        try {
                            const result = await Promise.race([
                                supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 5000))
                            ]) as any;
                            profile = result?.data;
                        } catch (e) {
                            console.warn('[Session] Profile fetch timed out, using metadata');
                        }

                        if (profile) {
                            profileCache.current = {
                                role: profile.role,
                                organization_id: profile.organization_id,
                                full_name: profile.full_name,
                                phone: profile.phone
                            };
                        }

                        const role = (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || 'patient';
                        const orgId = profile?.organization_id || session.user.user_metadata?.organization_id;

                        // For org_admin: verify their organization is still approved
                        if (role === 'org_admin' && orgId) {
                            try {
                                const { data: orgData } = await supabase
                                    .from('organizations')
                                    .select('status')
                                    .eq('id', orgId)
                                    .single();

                                if (orgData && orgData.status !== 'approved') {
                                    console.log('[Session] Org not approved, signing out. Status:', orgData.status);
                                    await supabase.auth.signOut({ scope: 'local' });
                                    setUser(null);
                                    setLoading(false);
                                    return;
                                }
                            } catch (orgErr) {
                                console.warn('[Session] Org status check failed:', orgErr);
                            }
                        }

                        // Enrich user with profile data
                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: profile?.full_name || session.user.user_metadata?.full_name || 'User',
                            role,
                            phone: profile?.phone,
                            organization_id: orgId,
                        });
                    }
                } catch (err) {
                    // getSession() can fail with AbortError if client state is corrupted
                    // onAuthStateChange will still fire and set user from JWT metadata
                    console.warn('Session check error (onAuthStateChange will handle it):', err);
                }
            }
            setLoading(false);
        };

        checkSession();

        // Safety net: always clear loading after 3 seconds even if everything fails
        loadingTimeout = setTimeout(() => setLoading(false), 3000);

        if (isSupabaseConfigured()) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                // Skip during registration — RegisterPatient needs to finish patient insert first
                if (skipAuthRedirect.current) {
                    return;
                }

                if (session?.user) {
                    // Start with metadata
                    const metadata = session.user.user_metadata || {};
                    let role = (metadata.role as UserRole) || 'patient';
                    let orgId = metadata.organization_id;
                    let fullName = metadata.full_name || 'User';
                    let phone = metadata.phone;

                    // Apply cached profile data first (if any)
                    if (profileCache.current.organization_id) orgId = profileCache.current.organization_id;
                    if (profileCache.current.role) role = profileCache.current.role;
                    if (profileCache.current.full_name) fullName = profileCache.current.full_name;

                    // Fetch profile to enrich data, UNLESS it's a token refresh (to avoid hang)
                    if (event !== 'TOKEN_REFRESHED' && event !== 'SIGNED_OUT') {
                        try {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', session.user.id)
                                .single();

                            if (profile) {
                                role = (profile.role as UserRole) || role;
                                orgId = profile.organization_id || orgId;
                                fullName = profile.full_name || fullName;
                                phone = profile.phone || phone;

                                // Update cache
                                profileCache.current = {
                                    role: profile.role,
                                    organization_id: profile.organization_id,
                                    full_name: profile.full_name,
                                    phone: profile.phone
                                };
                            }
                        } catch (err) {
                            console.warn('Profile fetch failed in onAuthStateChange:', err);
                        }
                    }

                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: fullName,
                        role,
                        phone: phone,
                        organization_id: orgId,
                    });
                    setLoading(false);
                } else {
                    const demoUser = localStorage.getItem('tempest_demo_user');
                    if (!demoUser) {
                        setUser(null);
                        profileCache.current = {}; // Clear cache on sign out
                    }
                    setLoading(false);
                }
            });

            return () => {
                clearTimeout(loadingTimeout);
                subscription.unsubscribe();
            };
        }

        return () => clearTimeout(loadingTimeout);
    }, []);

    // ─── Sign In (validates against Supabase Auth) ───
    const signIn = async (email: string, password: string): Promise<{ error?: string; role?: string }> => {
        if (!isSupabaseConfigured()) {
            return { error: 'Authentication service is not configured.' };
        }

        // CRITICAL: Block onAuthStateChange from running during signIn
        skipAuthRedirect.current = true;

        try {
            setUser(null);
            localStorage.removeItem('tempest_demo_user');

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (data?.session && data?.user) {
                const metadata = data.user.user_metadata || {};

                // Fetch profile — fast, single row lookup
                let profile: any = null;
                try {
                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                    profile = profileData;
                } catch { }

                const role = (profile?.role as UserRole) || (metadata.role as UserRole) || 'patient';

                // For org_admin: check if their organization is approved
                if (role === 'org_admin' && profile?.organization_id) {
                    try {
                        const { data: orgData } = await supabase
                            .from('organizations')
                            .select('status')
                            .eq('id', profile.organization_id)
                            .single();

                        if (orgData && orgData.status !== 'approved') {
                            await supabase.auth.signOut({ scope: 'local' });
                            return { error: `Your organization is ${orgData.status}. Please wait for admin approval before signing in.` };
                        }
                    } catch { }
                }

                setUser({
                    id: data.user.id,
                    email: data.user.email || '',
                    full_name: profile?.full_name || metadata.full_name || 'User',
                    role,
                    phone: profile?.phone,
                    organization_id: profile?.organization_id,
                });

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
            return { error: err.message || 'Unable to connect to authentication server.' };
        } finally {
            skipAuthRedirect.current = false;
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
            // Profile is created by the handle_new_user trigger.
            // Sign out immediately so the user is NOT auto-logged in.
            // They must go to the login page and sign in manually.
            await supabase.auth.signOut({ scope: 'local' });
            setUser(null);
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

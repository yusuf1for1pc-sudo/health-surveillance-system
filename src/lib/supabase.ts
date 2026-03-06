import { createClient } from '@supabase/supabase-js';

// Use Vercel Edge proxy for Supabase to bypass ISP blocking.
// During local dev, Vite serves this via proxy. In production, Vercel routes this to /api/proxy.js
const supabaseUrl = import.meta.env.VITE_USE_DIRECT_SUPABASE === 'true'
    ? (import.meta.env.VITE_SUPABASE_URL || 'https://jkhkgviyxkmuayenohhd.supabase.co')
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/proxy`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraGtndml5eGttdWF5ZW5vaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTY2OTQsImV4cCI6MjA4NjYzMjY5NH0.WDZ4eAyxloZqsrnN_8Bt1VF8EdOpxZoZFRZeKIJT4aI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Bypass navigator.locks API to prevent AbortError
        // navigator.locks is used for cross-tab token refresh coordination,
        // but it throws AbortError in certain browser/dev-server environments
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            return await fn();
        },
    } as any,
});

export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseAnonKey.length > 20;
};

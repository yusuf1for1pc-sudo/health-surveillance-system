import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jkhkgviyxkmuayenohhd.supabase.co';
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
    return supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 20;
};

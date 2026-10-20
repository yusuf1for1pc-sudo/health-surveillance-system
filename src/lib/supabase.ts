import { createClient } from '@supabase/supabase-js';
import { isDemoSession } from '@/lib/demoAccounts';
import { demoFrom, demoRpc } from '@/lib/demoSupabase';
import { cached, clearCache } from '@/lib/queryCache';

// Use Vercel Edge proxy for Supabase to bypass ISP blocking.
// During local dev, Vite serves this via proxy. In production, Vercel routes this to /api/proxy.js
const supabaseUrl = import.meta.env.VITE_USE_DIRECT_SUPABASE === 'true'
    ? (import.meta.env.VITE_SUPABASE_URL || 'https://jkhkgviyxkmuayenohhd.supabase.co')
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/proxy`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraGtndml5eGttdWF5ZW5vaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTY2OTQsImV4cCI6MjA4NjYzMjY5NH0.WDZ4eAyxloZqsrnN_8Bt1VF8EdOpxZoZFRZeKIJT4aI';

const realClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Bypass navigator.locks API to prevent AbortError
        // navigator.locks is used for cross-tab token refresh coordination,
        // but it throws AbortError in certain browser/dev-server environments
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            return await fn();
        },
    } as any,
});

/**
 * While a built-in demo account is signed in, table queries and RPCs are served from the
 * in-memory demo dataset instead of the network. Everything else (auth, storage) is the real client.
 */
const WRITE_METHODS = new Set(['insert', 'update', 'upsert', 'delete']);

/**
 * Wraps a PostgREST query so reads go through the stale-while-revalidate cache and any write
 * clears it. The chain of calls (table, filters, ranges...) is the cache key.
 */
const cachedQuery = (builder: any, table: string, calls: { m: string; a: unknown[] }[] = []): any =>
    new Proxy(builder, {
        get(target, prop) {
            if (prop === 'then') {
                const isRead = calls[0]?.m === 'select' && !calls.some(c => WRITE_METHODS.has(c.m));
                const key = isRead ? `sb:${table}:${JSON.stringify(calls)}` : '';
                return (onFulfilled?: any, onRejected?: any) => {
                    const run = isRead
                        ? cached(key, () => target as PromiseLike<any>, (res: any) => !res?.error)
                        : Promise.resolve(target as PromiseLike<any>).then((res: any) => { if (!res?.error) clearCache(); return res; });
                    return run.then(onFulfilled, onRejected);
                };
            }
            const value = Reflect.get(target, prop, target);
            if (typeof value !== 'function') return value;
            return (...args: unknown[]) => {
                const out = value.apply(target, args);
                return out && typeof out === 'object' && typeof out.then === 'function'
                    ? cachedQuery(out, table, [...calls, { m: String(prop), a: args }])
                    : out;
            };
        },
    });

export const supabase = new Proxy(realClient, {
    get(target, prop) {
        if (isDemoSession()) {
            if (prop === 'from') return demoFrom;
            if (prop === 'rpc') return demoRpc;
        }
        if (prop === 'from') return (table: string) => cachedQuery(target.from(table), table);
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
    },
}) as typeof realClient;

export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseAnonKey.length > 20;
};

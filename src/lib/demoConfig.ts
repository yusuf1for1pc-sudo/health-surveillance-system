// ─── Demo Mode Configuration ─────────────────────────────
// Set DEMO_MODE = true to load static JSON from /demo-data/
// instead of relying on Supabase / backend APIs.

export const DEMO_MODE: boolean =
    import.meta.env.VITE_DEMO_MODE === 'false' ? false : true; // default ON

// Simple in-memory cache so we only fetch each file once
const cache: Record<string, unknown> = {};

export async function fetchDemoData<T>(path: string): Promise<T> {
    if (cache[path]) return cache[path] as T;

    const res = await fetch(path);
    if (!res.ok) throw new Error(`Demo data fetch failed: ${path} (${res.status})`);

    const data = (await res.json()) as T;
    cache[path] = data;
    return data;
}

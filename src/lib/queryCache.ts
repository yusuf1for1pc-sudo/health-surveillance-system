/**
 * Stale-while-revalidate cache shared by Supabase reads and ML calls.
 *
 * - A read made again within FRESH_MS is answered from memory with no network request.
 * - Between FRESH_MS and MAX_STALE_MS the old data is returned immediately and refreshed in the
 *   background, so moving between pages never shows a spinner for data we already have.
 * - Older than MAX_STALE_MS it behaves like a normal request.
 * - The cache belongs to the signed-in user: it starts empty at login and is cleared on logout or
 *   when the user changes. Any write clears it so edits are never hidden behind stale reads.
 */

interface Entry { t: number; value: unknown }

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
let owner: string | null = null;

export const FRESH_MS = 60_000;
export const MAX_STALE_MS = 10 * 60_000;

const clone = <T>(v: T): T => {
    try { return structuredClone(v); } catch { return v; }
};

export const cacheGet = (key: string): { value: unknown; age: number } | null => {
    const e = store.get(key);
    if (!e) return null;
    const age = Date.now() - e.t;
    if (age > MAX_STALE_MS) { store.delete(key); return null; }
    return { value: clone(e.value), age };
};

export const cacheSet = (key: string, value: unknown) => {
    store.set(key, { t: Date.now(), value: clone(value) });
};

export const clearCache = () => {
    store.clear();
    inflight.clear();
};

/** Call whenever the signed-in user changes; a different owner always starts with an empty cache. */
export const setCacheOwner = (id: string | null) => {
    if (owner !== id) {
        clearCache();
        owner = id;
    }
};

/**
 * Runs `load` through the cache. `isOk` decides whether a result is worth remembering
 * (so errors are never cached).
 */
export async function cached<T>(key: string, load: () => PromiseLike<T> | T, isOk: (v: T) => boolean = () => true): Promise<T> {
    const hit = cacheGet(key);
    const refresh = () =>
        Promise.resolve(load())
            .then((v) => { if (isOk(v)) cacheSet(key, v); return v; })
            .catch(() => undefined);

    if (hit) {
        if (hit.age > FRESH_MS && !inflight.has(key)) {
            const p = refresh().finally(() => inflight.delete(key));
            inflight.set(key, p);
        }
        return hit.value as T;
    }

    // Single-flight: identical requests made at the same time share one network call
    const pending = inflight.get(key);
    if (pending) return clone((await pending) as T);

    const p = Promise.resolve(load()).then((v) => { if (isOk(v)) cacheSet(key, v); return v; });
    inflight.set(key, p);
    try {
        return await p;
    } finally {
        inflight.delete(key);
    }
}

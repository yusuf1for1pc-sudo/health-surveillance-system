export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        const url = new URL(req.url);

        // Get the Supabase URL from environment or fallback to project default
        // We try to grab from process.env but it might not be loaded identically in Edge,
        // hence the hardcoded fallback which perfectly matches the deployed project.
        const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jkhkgviyxkmuayenohhd.supabase.co';

        // Extract the path after /api/proxy. 
        // Vercel rewrites might make url.pathname start with /api/proxy
        let targetPath = url.pathname.replace(/^\/api\/proxy(\.js)?/, '');
        const targetUrl = new URL(targetPath + url.search, SUPABASE_URL);

        // Prepare headers, explicitly removing host/referer 
        const newHeaders = new Headers(req.headers);
        newHeaders.delete('host');
        newHeaders.delete('referer');

        const fetchOptions = {
            method: req.method,
            headers: newHeaders,
            redirect: 'manual',
        };

        // Edge Runtime allows passing the request body directly as a stream (except for GET/HEAD)
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            fetchOptions.body = req.body;
            // Duplex half is required by Node's fetch when using streams
            fetchOptions.duplex = 'half';
        }

        const response = await fetch(targetUrl, fetchOptions);

        // Forward response headers exactly as they are from Supabase
        const resHeaders = new Headers(response.headers);

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders
        });
    } catch (err) {
        console.error("Supabase Proxy Error:", err);
        return new Response(JSON.stringify({ error: 'Proxy implementation error', details: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}

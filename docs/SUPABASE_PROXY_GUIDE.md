# Bypassing ISP Blocking for Supabase

In certain regions, Internet Service Providers (ISPs) may block direct connections to `.supabase.co` domains. This prevents the application from authenticating users or querying the database. 

To solve this, **Tempest** uses a proxy configuration that routes Supabase traffic through the same domain serving the application, effectively bypassing the DNS/IP block.

## How It Works

The solution has two parts: one for local development (using Vite) and one for production (using Vercel).

### 1. The Frontend Client (`src/lib/supabase.ts`)
Instead of connecting directly to the Supabase URL, the frontend client connects to a relative path (`/api/proxy`).

```typescript
const supabaseUrl = import.meta.env.VITE_USE_DIRECT_SUPABASE === 'true'
    ? (import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co')
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/proxy`;
```

* If `VITE_USE_DIRECT_SUPABASE=true` is set in `.env`, it connects directly.
* By default, it uses `/api/proxy` appended to the current origin (e.g., `http://localhost:8080/api/proxy`).

### 2. Local Development Proxy (`vite.config.ts`)
When running `npm run dev`, Vite acts as our local web server. We configure Vite to intercept any requests made to `/api/proxy` and forward them to Supabase under the hood. Since this proxying happens server-side via Node.js, the ISP block in the browser is bypassed.

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://YOUR_PROJECT_ID.supabase.co', // The actual Supabase URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
      },
    },
  },
}));
```

### 3. Production Proxy (`api/proxy.js`)
When deployed to Vercel, the Vite dev server is gone. Instead, we use a Vercel Serverless Function (or Edge Function) to handle the proxying. 

Vercel intercepts requests to `/api/proxy` and runs the `api/proxy.js` script. This script takes the incoming request, forwards it to Supabase, and pipes the response back to the client.

```javascript
// api/proxy.js
import { createProxyMiddleware } from 'http-proxy-middleware';

export default function (req, res) {
  const targetUrl = process.env.VITE_SUPABASE_URL;
  
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: { '^/api/proxy': '' },
  });

  return proxy(req, res);
}
```

## Troubleshooting

*   **Local UI says "Failed to fetch":** Ensure your Vite server is running. If you try to open the `index.html` file directly without running `npm run dev`, the proxy will not be active and the relative URL will fail.
*   **Need to test a direct connection?** Create a `.env` file in the root folder and add:
    ```
    VITE_USE_DIRECT_SUPABASE=true
    ```
    Then restart the Vite dev server. This disables the proxy and attempts a direct connection to Supabase.


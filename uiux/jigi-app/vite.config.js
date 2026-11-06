import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
var apiProxyTarget = process.env.VITE_API_TARGET || 'http://localhost:3000';
var apiProxy = {
    '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        configure: function (proxy) {
            proxy.on('error', function (err, _req, res) {
                var out = res;
                if ((out === null || out === void 0 ? void 0 : out.writeHead) && !out.headersSent) {
                    out.writeHead(502, { 'Content-Type': 'application/json' });
                    out.end(JSON.stringify({
                        error: 'Local API unreachable',
                        hint: 'Start the API on port 3000: `pnpm dev:api` or run both with `pnpm dev:full`. ' +
                            "Proxy target was ".concat(apiProxyTarget, "."),
                        cause: err instanceof Error ? err.message : String(err),
                    }));
                }
            });
        },
    },
};
export default defineConfig({
    plugins: [react()],
    // @ts-expect-error - Vitest extends Vite config with test; types not merged in this setup
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/test/'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        // Forward /api to local API (3000) or Vercel dev; JSON 502 if backend is down (avoid HTML / broke .json() in console).
        proxy: apiProxy,
    },
    preview: {
        proxy: apiProxy,
    },
});

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
// Fallback FAL key so `npm run dev` works without extra setup. Prefer setting
// FAL_API_KEY in a .env file (or the shell) to override this in real usage.
const FAL_DEV_FALLBACK_KEY =
  "86b47234-1e41-423c-a055-f96f2c06d165:b38970272c89034868fdafea921121ca";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const falKey = env.FAL_API_KEY || env.VITE_FAL_API_KEY || FAL_DEV_FALLBACK_KEY;

  return {
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // Dev-only proxy: forwards browser calls to FAL's queue with the API key
        // injected server-side and the browser Origin stripped (FAL 403s any
        // request that carries an Origin header). Production uses /api/fal.ts.
        "/api/fal": {
          target: "https://queue.fal.run",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/fal/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
              proxyReq.setHeader("Authorization", `Key ${falKey}`);
            });
          },
        },
      },
    },
  };
});

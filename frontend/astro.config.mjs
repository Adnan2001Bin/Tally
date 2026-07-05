import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
const apiUrl = env.PUBLIC_API_URL ?? "http://localhost:4000";

/** Dev-only: rewrite /group/CODE → /group/join?code=CODE (matches public/_redirects in prod). */
function groupInviteDevRewrite() {
  return {
    name: "group-invite-dev-rewrite",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next();
        const [pathname, search = ""] = req.url.split("?");
        const match = pathname.match(/^\/group\/([A-Za-z0-9]+)\/?$/);
        if (match) {
          const qs = new URLSearchParams(search);
          qs.set("code", match[1]);
          req.url = `/group/join?${qs.toString()}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  integrations: [
    react({
      include: ["**/src/components/**"],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
  vite: {
    plugins: [groupInviteDevRewrite()],
    define: {
      __API_URL__: JSON.stringify(apiUrl),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "axios",
      ],
    },
  },
});

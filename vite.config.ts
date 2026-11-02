import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    ...(command === "build"
      ? [
          {
            name: "doran-production-csp",
            transformIndexHtml: () => [
              {
                tag: "meta",
                attrs: {
                  "http-equiv": "Content-Security-Policy",
                  content:
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
                },
                injectTo: "head" as const,
              },
            ],
          },
        ]
      : []),
  ],
  base: "./",
  build: { emptyOutDir: true },
  server: { allowedHosts: ["terminal.local"] },
}));

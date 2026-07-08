import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createHtmlPlugin } from "vite-plugin-html";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        keepClosingSlash: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: "none",
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        // Isolate the admin panel into its own chunk so storefront visitors
        // never download admin code. Any module under src/pages/admin or
        // src/components/admin (and the AdminApp shell) is grouped together.
        manualChunks(id) {
          if (
            id.includes("/src/apps/admin/") ||
            id.includes("/src/pages/admin/") ||
            id.includes("/src/components/admin/")
          ) {
            return "admin";
          }
        },
      },
    },
  },

}));

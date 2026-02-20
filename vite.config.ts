import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React runtime - smallest possible critical chunk
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-core";
          }
          // Router - needed for first render
          if (id.includes("node_modules/react-router-dom/") || id.includes("node_modules/@remix-run/")) {
            return "router";
          }
          // Supabase - split from main so it can load in parallel
          if (id.includes("node_modules/@supabase/")) {
            return "supabase";
          }
          // React Query
          if (id.includes("node_modules/@tanstack/")) {
            return "query";
          }
          // Radix UI primitives
          if (id.includes("node_modules/@radix-ui/")) {
            return "ui";
          }
          // Heavy chart/carousel libraries - defer
          if (id.includes("node_modules/recharts") || id.includes("node_modules/embla-carousel")) {
            return "charts";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns") || id.includes("node_modules/react-day-picker")) {
            return "dates";
          }
          // Other node_modules go into vendor
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
      },
    },
  },
}));

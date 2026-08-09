import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createHtmlPlugin } from "vite-plugin-html";

// Vendor grouping tuned for Cloudflare Pages + fast storefront load.
// Keeps React/core small, splits heavy UI libs, and lets Cloudflare cache
// each chunk with a long immutable fingerprint.
const manualChunks = (id: string) => {
  if (id.includes("node_modules")) {
    if (id.includes("react-dom") || id.includes("react-router-dom") || id.includes("react/")) {
      return "vendor-react";
    }
    if (id.includes("@tanstack/react-query")) {
      return "vendor-query";
    }
    if (id.includes("@supabase")) {
      return "vendor-supabase";
    }
    if (id.includes("@radix-ui")) {
      return "vendor-radix";
    }
    if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform/resolvers")) {
      return "vendor-form";
    }
    if (id.includes("lucide-react")) {
      return "vendor-icons";
    }
    if (id.includes("recharts")) {
      return "vendor-charts";
    }
    if (id.includes("date-fns")) {
      return "vendor-date";
    }
    if (id.includes("embla-carousel")) {
      return "vendor-carousel";
    }
    if (
      id.includes("class-variance-authority") ||
      id.includes("tailwind-merge") ||
      id.includes("clsx") ||
      id.includes("sonner") ||
      id.includes("next-themes") ||
      id.includes("@babel/runtime") // pulled in by several UI libs
    ) {
      return "vendor-ui";
    }
    return "vendor-misc";
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
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
  ],
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
        manualChunks,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || "";
          if (/\.(css)$/i.test(info)) return "assets/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));

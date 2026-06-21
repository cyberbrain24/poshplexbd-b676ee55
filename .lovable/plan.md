# Streamline Code (Safe Subset)

Implement code-streamlining optimizations **without touching the inline gtag script** in `index.html`. GA bootstrap stays exactly as it is today.

## Changes

### 1. HTML Minification
Add `vite-plugin-html` to `vite.config.ts` with `minify: true`. The built `index.html` will have whitespace, line breaks, and comments stripped, and inline `<script>`/`<style>` blocks compacted. No tag is removed or reordered — the GA snippet stays intact, just minified.

### 2. Preload Main JS Entry Chunk
Use `vite-plugin-html`'s inject option to add `<link rel="modulepreload" href="/src/main.tsx">` (resolved to the hashed entry chunk at build time) so the browser begins fetching app JS in parallel with CSS. Pure browser hint; ignored by older browsers.

### 3. Strip esbuild Legal Comments
Add `esbuild: { legalComments: "none" }` to `vite.config.ts` to remove license banners from the JS output, shrinking bundle size slightly.

## Files Touched

- `vite.config.ts` — register `vite-plugin-html`, add `esbuild.legalComments`.
- `package.json` — add `vite-plugin-html` dev dependency.

## Files NOT Touched

- `index.html` — gtag inline script and all `<head>` content remain unchanged in source.
- `public/` — no new files.
- Any React/route code — no lazy-loading changes.

## Success Criteria

- Built `index.html` is minified (single-line, no comments).
- Modulepreload link present for main entry chunk.
- JS bundle no longer contains `/*! ... */` license banners.
- GA tracking continues to work identically (no behavioral change).
- No regression in dev mode (`vite-plugin-html` only acts at build time).

## Risk

Near-zero. All three changes are build-time output transformations. Runtime behavior of the app is unchanged.

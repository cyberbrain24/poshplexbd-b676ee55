## Goal
Add a Typography panel in **Admin → Site Settings** so you can pick fonts for each text element of the storefront (H1, H2, H3, H4, H5/H6, body/paragraph, navigation/buttons) without touching code. Changes apply site-wide instantly.

## What you'll see in admin
A new **"Typography"** card in Site Settings with one row per element:

| Element | Font dropdown | Weight | Size scale | Preview |
|---|---|---|---|---|
| H1 (Display) | Anton / This is Fire / Bebas Neue / Archivo Black / … | 400–900 | 0.8x–1.4x | live sample |
| H2 | Natoor / Anton / Space Grotesk / … | | | |
| H3 | … | | | |
| H4 | … | | | |
| H5 / H6 | … | | | |
| Body / Paragraph | Poppins / Inter / Space Grotesk / DM Sans / Archivo / IBM Plex Sans / Manrope / JetBrains Mono / Geist / Söhne-like | | | |
| Navigation & Buttons | … | | | |

Each row also has: **Uppercase toggle**, **Letter spacing** (tight/normal/wide), **Reset** button.

A curated catalog of ~20 streetwear-appropriate fonts (Google Fonts + your existing local fonts: Street Culture, Wood Chaos, This is Fire, Natoor) is preloaded — no need to type font names.

A **"Save & Apply"** button writes settings and refreshes the live preview in the same tab.

## How it works (technical section)

### 1. Database (migration)
Add JSON column to existing `site_settings` table:
```sql
ALTER TABLE public.site_settings
ADD COLUMN typography jsonb DEFAULT '{}'::jsonb;
```
Shape stored:
```json
{
  "h1": { "family": "This is Fire", "weight": 400, "scale": 1, "uppercase": true, "tracking": "tight" },
  "h2": { ... }, "h3": {...}, "h4": {...}, "h5": {...},
  "body": { "family": "Poppins", "weight": 400, "scale": 1, "uppercase": false, "tracking": "normal" },
  "nav":  { ... }
}
```

### 2. Font catalog
New file `src/lib/fontCatalog.ts` — curated list with `{ name, googleHref?, localFamily?, category: 'display'|'sans'|'mono' }`. Includes existing local fonts + Google fonts: Anton, Bebas Neue, Archivo Black, Archivo, Space Grotesk, Space Mono, Inter, DM Sans, Manrope, IBM Plex Sans, JetBrains Mono, Plus Jakarta Sans, Syne, Sora, Urbanist.

### 3. Runtime injection
New `src/components/TypographyProvider.tsx` mounted in `App.tsx`:
- Fetches `site_settings.typography` once via React Query (cached, refetched on settings save).
- Dynamically appends `<link>` tags to `<head>` for any Google fonts referenced.
- Writes a `<style id="dynamic-typography">` block with CSS variables and overrides, e.g.:
  ```css
  :root {
    --font-h1: 'This is Fire', Impact, sans-serif;
    --font-body: 'Poppins', sans-serif;
    --tracking-h1: -0.02em;
  }
  h1 { font-family: var(--font-h1) !important; ... }
  body, p, span, li, a, label { font-family: var(--font-body); }
  ```
- Skips override inside `.admin-shell` so the admin panel keeps its system-font reset.

### 4. Admin UI
New `src/components/admin/TypographySettings.tsx` rendered inside `AdminSiteSettings.tsx`:
- React Hook Form state seeded from current row.
- Per-row: `<Select>` for family (grouped: Display / Sans / Mono / Local), weight `<Select>`, scale `<Slider>` (0.8–1.4 step 0.05), `<Switch>` for uppercase, `<Select>` for letter spacing, live preview using inline `style`.
- "Save & Apply" calls `supabase.from('site_settings').update({ typography }).eq('id', row.id)` then invalidates the React Query cache so `TypographyProvider` reapplies immediately.
- "Reset to defaults" restores baked-in defaults that match current site (This is Fire H1, Natoor H2, Anton H3+, Poppins body).

### 5. Files to add/edit
- **Add**: `supabase/migrations/<ts>_add_typography_to_site_settings.sql`
- **Add**: `src/lib/fontCatalog.ts`
- **Add**: `src/components/TypographyProvider.tsx`
- **Add**: `src/components/admin/TypographySettings.tsx`
- **Edit**: `src/App.tsx` (mount provider above routes)
- **Edit**: `src/pages/admin/AdminSiteSettings.tsx` (insert Typography card)

### Out of scope
- Per-page overrides (only global).
- Font upload (catalog only — you can request custom additions later).
- No changes to existing tokens in `index.css`; new overrides layer on top via `!important` for the targeted selectors only.

Ready to build when you approve.
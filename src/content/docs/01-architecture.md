---
title: Architecture Overview
category: Architecture
order: 1
updated: 2026-06-10
---

# POSHPLEX Architecture

POSHPLEX is a React + Vite + TypeScript single-page app served from the Lovable platform, backed by a managed Postgres database, auth, storage, and edge functions ("Lovable Cloud").

## Frontend

- **Framework:** React 18 + Vite 5 + TypeScript 5
- **Routing:** `react-router-dom` v6, BrowserRouter with `future` flags enabled
- **UI:** Tailwind CSS v3, shadcn/ui (Radix primitives)
- **State:** React Query (`@tanstack/react-query`) for server state, React Context for cart / favorites / music player
- **Forms:** `react-hook-form` + `zod` schemas in `src/utils/validation-schemas.ts`

### Code-splitting

- Storefront pages (Index, Category, Product) are eagerly imported because they are on the critical path.
- Every admin page is `React.lazy()`-imported as its own chunk. The admin sidebar prefetches chunks on hover / focus via `src/lib/adminRoutePrefetch.ts`, and `AdminLayout` schedules an idle-time prefetch of all admin chunks once the shell mounts.

## Backend (Lovable Cloud)

- **Database:** Postgres with Row Level Security on every public table
- **Auth:** Email/phone unified auth (phone numbers map to `[number]@phone.local` shadow emails)
- **RBAC:** A separate `user_roles` table + `public.has_role(uuid, app_role)` SECURITY DEFINER function. Roles must never live on the user / profile row.
- **Edge functions:** TypeScript Deno functions under `supabase/functions/*`. Shared utilities live in `supabase/functions/_shared/`.
- **Storage:** Buckets for product images, review images, hero banners.

## Key conventions

- Currency: Taka (৳) with `en-BD` locale, formatted via `src/lib/currency.ts`.
- All admin routes live under `/admin/*` and are gated by `ProtectedRoute` + RBAC check.
- Never edit the auto-generated files `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, or `.env`.

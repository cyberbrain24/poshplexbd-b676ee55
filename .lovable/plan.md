## User Roles & Permissions Module

Add a new admin-only module where the super-admin creates sub-admin accounts with a **username + password** and controls which admin modules each sub-admin can see, via checkboxes. Super-admin (`poshplexbd@gmail.com`) always bypasses these checks.

### 1. Database (single migration)

- New table `public.admin_permissions`
  - `user_id uuid` (FK → `auth.users`, unique)
  - `username text unique not null`
  - `modules text[] not null default '{}'` — list of allowed module keys
  - `is_active boolean default true`
  - timestamps
- RLS: only admins (via existing `has_role`) can select/insert/update/delete.
- Helper function `public.get_my_allowed_modules()` (SECURITY DEFINER) that returns:
  - `NULL` if super-admin (bypass = full access)
  - `modules` array otherwise
- The super-admin email is resolved by checking `auth.users.email = 'poshplexbd@gmail.com'`.

### 2. Auth strategy (username + password)

- Username maps to shadow email `"<username>@admin.local"` (mirrors existing phone-shadow pattern).
- Creation happens through a new edge function `create-admin-user` (uses service role) that:
  1. Verifies caller is admin.
  2. Creates the auth user with the shadow email + password (auto-confirmed).
  3. Inserts a row in `user_roles` with role `admin`.
  4. Inserts a row in `admin_permissions` with the selected modules.
- Login: existing `/auth` page already accepts email; we add a small "username" input that submits `<username>@admin.local` under the hood. No change for the primary admin.
- Password reset / permission update / deactivate → same edge function with actions: `create | update_password | update_modules | deactivate`.

### 3. Module keys (checkbox list in the UI)

Flat list covering every current admin route:

```text
dashboard, products, categories, colors, sizes, size-guides,
orders, add-order, order-fulfillment, payment-methods,
customers, customer-types, divisions, thanas,
reviews, site-settings,
marketing, marketing.meta-pixel, marketing.meta-capi, marketing.steadfast,
user-roles
```

`user-roles` itself is only visible to super-admin (hard-coded).

### 4. Frontend

- New page `src/pages/admin/AdminUserRoles.tsx` — list sub-admins, "Add user" modal (username, password, checkbox grid of modules), edit, deactivate.
- New hook `src/hooks/usePermissions.ts` — loads once on admin mount:
  - Returns `{ isSuperAdmin, allowedModules: Set<string> | 'all' }`.
  - Cached in React Query (staleTime 5min) → zero perf impact.
- `AdminSidebar.tsx`: filter each nav item by `allowedModules.has(key) || allowedModules === 'all'`.
- `AdminApp.tsx`: wrap routes with a lightweight `<PermissionGuard module="…">` that redirects to `/admin` (dashboard or first allowed module) if not permitted. Dashboard is always allowed.
- Route added: `/admin/user-roles`.

### 5. Performance safeguards

- Single query on admin mount, cached; no per-navigation network hit.
- No storefront impact — all code lives under `src/apps/admin/` and lazy-loads with the existing admin bundle.
- No new dependencies.

### 6. Out of scope (per your answers)

- No RLS enforcement per module on data tables (sidebar-visibility model only).
- No email-based sub-admin login.
- Sub-admins granted the `admin` role still have DB-level admin access; permissions are a UI/UX gate, not a security boundary. Noted so expectations are clear.

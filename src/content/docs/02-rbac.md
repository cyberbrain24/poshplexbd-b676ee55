---
title: Access Control & Admin Identity
category: Security
order: 5
updated: 2026-06-10
---

# Access Control (RBAC)

Admin access to `/admin/*` is gated client-side by `ProtectedRoute` and database-side by RLS policies that check `public.has_role(auth.uid(), 'admin')`.

## Tables

- `user_roles(user_id, role)` — single source of truth for roles. The `app_role` enum currently has `admin`, `moderator`, `user`.
- The `has_role(_user_id uuid, _role app_role)` function is `SECURITY DEFINER` and bypasses RLS to avoid recursive checks inside policies.

## Why a separate table?

Storing roles on the `profiles` or `customers` table is a privilege-escalation risk: any update path on that row can be abused to grant admin. The separate `user_roles` table has its own RLS that only admins can mutate.

## Admin identity

- Primary admin email: **poshplexbd@gmail.com**

## Adding a new admin

```sql
insert into public.user_roles (user_id, role)
values ('<auth-user-uuid>', 'admin');
```

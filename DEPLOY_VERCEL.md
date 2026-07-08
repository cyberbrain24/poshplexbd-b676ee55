# Deploying the POSHPLEX frontend to Vercel

The backend (database, auth, storage, edge functions) stays on **Lovable Cloud**.
Only the Vite + React frontend is deployed to Vercel.

## 1. Connect the GitHub repo

In Lovable: **GitHub → Connect to GitHub → Create Repository**.
Every edit you make in Lovable is auto-pushed to that repo.

## 2. Import the repo on Vercel

1. Go to <https://vercel.com/new> and pick the repo.
2. Framework preset: **Vite** (auto-detected).
3. Build command: `npm run build` (already in `vercel.json`).
4. Output directory: `dist` (already in `vercel.json`).

## 3. Add environment variables on Vercel

**Project Settings → Environment Variables** — add these three (Production +
Preview + Development). Copy the values from the Lovable project `.env`:

| Name                             | Value                                              |
| -------------------------------- | -------------------------------------------------- |
| `VITE_SUPABASE_PROJECT_ID`       | `zspmhkzosumopyfmlwvl`                             |
| `VITE_SUPABASE_URL`              | `https://zspmhkzosumopyfmlwvl.supabase.co`         |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | (long JWT string — copy exactly from Lovable .env) |

These are the public anon/publishable keys. RLS protects the data, so shipping
them in the browser bundle is expected and safe.

## 4. Deploy

Click **Deploy**. First build takes ~1–2 minutes.

## 5. Point your custom domain

`poshplexbd.com` is currently pointed at Lovable hosting. To switch:

1. In Vercel: **Project → Settings → Domains → Add** `poshplexbd.com` and
   `www.poshplexbd.com`.
2. Update DNS at your registrar to the records Vercel shows.
3. Wait for DNS propagation (a few minutes to a few hours).

Until DNS moves, the Vercel deployment lives at
`<project-name>.vercel.app` — safe to test in parallel.

## 6. Ongoing workflow

- Keep editing in **Lovable** as usual.
- Every push → Vercel auto-rebuilds and redeploys the frontend.
- Backend changes (edge functions, migrations) deploy automatically on
  Lovable Cloud — no Vercel involvement.

## What Vercel does NOT need

`.vercelignore` excludes:

- `supabase/` — edge functions + migrations live on Lovable Cloud only.
- `.lovable/` — Lovable internal state.
- Docs and lockfile artifacts.

## Troubleshooting

- **Blank page after deploy** → env vars missing on Vercel. Re-check step 3.
- **404 on refresh at `/category/...`** → `vercel.json` rewrites handle this.
  If it still 404s, confirm `vercel.json` is at the repo root and the deploy
  picked it up (visible in Vercel build logs).
- **Supabase requests fail with CORS** → in the Supabase dashboard (accessed
  via Lovable), add your Vercel domain to the allowed URLs. On Lovable Cloud
  this is managed automatically for `*.lovable.app`; you may need to open a
  support request to add a Vercel domain.

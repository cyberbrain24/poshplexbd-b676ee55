Goal: deploy poshplexbd.com (React frontend) on your Contabo VPS with nginx, then layer on extras. Each phase ends with a verification command so you know it worked before moving on.

Your stack stays:
```text
poshplexbd.com (VPS + nginx)  ──►  Lovable Cloud (DB, Auth, Storage, Edge Functions)
```

---

## Phase 1 — Base system + firewall
Install nginx, git, curl, ufw. Open 22/80/443 only.

**Verify:** `sudo ufw status` shows 3 rules, `nginx -v` prints version.

---

## Phase 2 — Install Bun (build tool)
Install Bun for root, symlink to `/usr/local/bin` so sudo can use it.

**Verify:** `bun --version` prints a version number.

---

## Phase 3 — Clone & build the frontend
- Clone the repo into `/var/www/poshplexbd-src`
- Create `.env.production` with your Lovable Cloud anon key + URL
- Run `bun install && bun run build`
- Copy `dist/` to `/var/www/poshplexbd`

**Verify:** `ls /var/www/poshplexbd/index.html` exists.

---

## Phase 4 — nginx config for SPA
Write `/etc/nginx/sites-available/poshplexbd` with:
- `root /var/www/poshplexbd`
- `try_files $uri /index.html` (SPA fallback for React Router)
- gzip + brotli + 1-year cache on `/assets/*`
- security headers

Enable site, disable default, reload nginx.

**Verify:** `curl -I http://YOUR_VPS_IP` returns `200 OK`. Visit the IP in your browser — site loads (still HTTP).

---

## Phase 5 — Point poshplexbd.com to the VPS
At your DNS provider (currently Lovable):
- `A` record `@` → VPS IP
- `A` record `www` → VPS IP
- TTL: 300 (5 min) during migration

**Verify:** `dig poshplexbd.com +short` returns your VPS IP.

⚠️ Wait for DNS to propagate before Phase 6 — Let's Encrypt validates over HTTP.

---

## Phase 6 — Free SSL with Let's Encrypt
Install certbot, run `certbot --nginx -d poshplexbd.com -d www.poshplexbd.com`. Auto-renew is set up automatically by the certbot package.

**Verify:** `https://poshplexbd.com` loads with a padlock. `sudo certbot renew --dry-run` succeeds.

---

## Phase 7 — Redeploy workflow
Write a small `/usr/local/bin/deploy-poshplex.sh` script:
```text
cd /var/www/poshplexbd-src
git pull
bun install
bun run build
rsync -a --delete dist/ /var/www/poshplexbd/
```
So future updates = `sudo deploy-poshplex.sh`.

**Verify:** run it once, check site still loads.

---

## Optional later phases (skip for now, ask when ready)
- **Phase 8** — Cloudflare in front (free CDN + DDoS + analytics)
- **Phase 9** — imgproxy on `:8081` for on-the-fly image resizing
- **Phase 10** — Fail2ban + UFW rate limits + auto-security-updates

---

## How this will go in chat
You answer "ready for Phase 1" and I paste the exact commands for that phase + the verify command. You run, paste output, we move to the next phase. No Docker anywhere — all native systemd + binaries.

Important things I need from you before Phase 3:
1. Your **VPS public IP** (so I can write correct nginx + DNS instructions)
2. Confirm the **GitHub repo URL** for the project (or you'll upload `dist/` via scp instead of building on the VPS)
3. Where your **domain DNS is currently managed** (Lovable nameservers, or you already moved it to Cloudflare/registrar?)

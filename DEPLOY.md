# Deploying to Railway

Same model as the backend — push to `main`, Railway redeploys.

## What's already wired

- [`railway.json`](railway.json) — explicit Next.js build/start commands
- `package.json` scripts: `build` → `next build`, `start` → `next start`
- `.gitignore` covers `.next/`, `.env*`, `node_modules`

## One-time Railway setup

### 1. Push the railway.json change to GitHub
```bash
git add railway.json DEPLOY.md
git commit -m "chore: prep for Railway deploy"
git push origin main
```

### 2. Create the Railway service
Two options:

**A) Same project as the backend (recommended).** Open your existing Railway project → **+ Add Service** → **GitHub Repo** → pick `sureride-dashboard`. The dashboard and backend can reference each other's URLs via Railway variables.

**B) Separate project.** [railway.com](https://railway.com) → New Project → Deploy from GitHub repo → `sureride-dashboard`.

### 3. Set env vars

Dashboard service → **Variables** tab:

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://<backend>.up.railway.app` | Backend's Railway domain. If same project, use `${{sureride-backend.PUBLIC_BASE_URL}}` or paste the URL. **Don't include a trailing slash.** |
| `NEXT_PUBLIC_VEHICLE_CATALOG_BASE_URL` | (your provider) | Optional |
| `NEXT_PUBLIC_VEHICLE_CATALOG_API_KEY` | (your key) | Optional |
| `NEXT_PUBLIC_VEHICLE_CATALOG_SOURCE` | e.g. `nhtsa` | Optional |

> `NEXT_PUBLIC_*` vars are baked into the client bundle **at build time**. If you change one, Railway triggers a rebuild automatically — no manual restart needed.

### 4. Generate a public domain

Settings → Networking → Generate Domain. Add that URL to the **backend's** `CORS_ORIGINS` env var so cross-origin requests work.

### 5. Trigger first deploy

Railway redeploys on any variable change. Or click **Deploy**.

## Auto-deploy from here on

Push to `main` → rebuild + redeploy. Next.js standalone output isn't enabled by default; the start command runs the standard `next start` server. Works fine on Railway's default container size.

## If you're using Vercel instead

The repo is Vercel-compatible too (just push and "Import Project"). Vercel often gives faster cold starts for Next.js specifically. The only thing Railway buys you here is **one platform for backend + dashboard**, simpler bills. Either works.

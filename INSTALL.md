# Installing the SureRide Dashboard

The dashboard is a Next.js 14 app that talks to the SureRide backend
over HTTPS. Same admins use it; providers use the same codebase under
`/provider/*`.

## Prereqs

- Node.js 20+
- A deployed backend (see `sureride-backend/INSTALL.md`)
- A domain to host the dashboard on (e.g. `admin.your-name.com`)

## 1. Configure

```bash
cd sureride-dashboard
npm install
cp .env.example .env.local
# Edit .env.local — only NEXT_PUBLIC_API_BASE_URL is required
```

The only variable you MUST set is `NEXT_PUBLIC_API_BASE_URL` pointing
at your backend (e.g. `https://api.your-name.com`). Everything else
is optional and configurable later through the in-app Platform Settings.

## 2. Build and start

### Option A — Vercel (recommended)

1. Push this folder to its own GitHub repo
2. Click "Import" in your Vercel dashboard
3. Add the env vars above in the Vercel project settings
4. Vercel auto-deploys on every push

### Option B — self-host

```bash
npm run build
npm start  # listens on $PORT, default 3000
```

Put nginx or Caddy in front for SSL.

## 3. First run

Open `https://your-dashboard-domain.com/install` — paste your license
key from the purchase email. After activation you'll be redirected to
the sign-in page.

The backend ships with one demo admin you can use to bootstrap (the
backend logs its randomly-generated password at first boot). **Change
that password immediately** and add a real admin under
`/rentals/employees`.

## 4. Theming

Once signed in, open **Business → Theme** to change the brand color.
Updates apply instantly to every surface — admins, providers, banners,
KPI tiles. Backed by `var(--brand-primary)` everywhere.

## Updates

```bash
git pull
npm install
npm run build
# restart (or push to Vercel)
```

## Support

`support@surerideautoservices.com` — include your **installation
fingerprint** (Platform Settings → License) in every ticket.

# Deployment and operations

## Deploy to Vercel

Deploy the client and API as **two separate Vercel projects** connected to this repository. The Express entry point is `server/src/index.ts`; Vercel's Express integration forwards requests to the exported app, which retains all `/api/v1/*` routes. The local listener is separate, so serverless startup does not call `listen()` or load a local `.env` file.

### API project

- **Root Directory:** `server`
- **Framework Preset:** Express (auto-detect if offered)
- **Install Command:** Vercel default (`npm install`)
- **Build Command:** `npm run build`
- **Output Directory:** leave unset
- **Node.js Version:** 22.x (Node.js 20.19+ is also supported by this project)

The build command must run from the `server` root. It generates Prisma Client from `prisma/schema.prisma`, type-checks/emits TypeScript into `dist`, and copies the generated Prisma Client into `dist/generated/prisma`. `server/vercel.json` also includes `generated/prisma/**` in the Express function bundle. It does not run migrations or seed data.

Configure these variables for the API project's Production and Preview environments:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for the deployed database. Use the provider's serverless/pooling URL where appropriate. |
| `SESSION_SECRET` | A unique cryptographically random secret, at least 32 characters. Production rejects missing secrets, the built-in development fallback, low-diversity secrets, and secrets with insufficient entropy. Use separate secrets for Production and Preview. |
| `CLIENT_ORIGIN` | Exact HTTPS origin of the corresponding client deployment, for example `https://hms.example.com` (no path or wildcard). |

Vercel provides `VERCEL=1`; the API treats Vercel deployments, including previews, as production for origin validation and secure cookies. Vercel supplies `NODE_ENV` for its deployment environment. Optional application settings are `SESSION_IDLE_MINUTES`, `LOGIN_LOCK_MINUTES`, and `FEE_OVERDUE_GRACE_DAYS`; their defaults are 15, 15, and 7.

### Client project

- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Install Command:** Vercel default (`npm install`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Set `VITE_API_URL` in the client project's Production and Preview environments to the full API base URL, including `/api/v1`, for example `https://hms-api.example.com/api/v1`. The production build fails if this is missing, rather than silently sending API requests to the client domain. The local development fallback remains `/api/v1`, served through the existing Vite proxy. Axios continues to send credentials.

Use stable deployment domains/aliases for Preview if the client and API need to share a fixed origin: set the API's `CLIENT_ORIGIN` to the exact client origin and the client's `VITE_API_URL` to the exact API base URL. The API reflects only the configured origin and allows credentials; it does not use wildcard CORS. Production session cookies are `HttpOnly`, `Secure`, and `SameSite=None` so credentialed requests also work when the client and API are on different sites.

### Production migrations

Apply the checked-in migrations separately and intentionally, after configuring the production `DATABASE_URL`. From the `server` root run:

```powershell
npx prisma migrate deploy --schema prisma/schema.prisma
```

This command does not reset the database or seed it. Do not run `prisma migrate reset` or seed demo data in production. Never put database credentials in source control or build logs.

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: unique random secret of at least 32 characters with high entropy; keep it in the host secret store.
- `CLIENT_ORIGIN`: exact HTTPS public client origin; the local development origin allowlist is not enabled in production.
- `VITE_API_URL` (client build): full deployed API base URL ending in `/api/v1`.
- `NODE_ENV`, `PORT`: Vercel sets the runtime environment and request port; `PORT` is only used by the local listener.
- `SESSION_IDLE_MINUTES` (default 15), `LOGIN_LOCK_MINUTES` (default 15).
- `FEE_OVERDUE_GRACE_DAYS` (default 7; integer from 0 to 3650). An unpaid fee is marked overdue once this many full days have elapsed after its due timestamp.
- `SEED_*_PASSWORD`: development seed values only. Do not seed demo accounts into a production database.

Never commit `.env`. Vercel terminates HTTPS; the API marks session cookies Secure in Vercel deployments and requires a strong session secret.

## Backups

Configure a host scheduler to run a daily PostgreSQL custom-format dump (`pg_dump -Fc`) and retain at least 30 daily copies in protected storage. Encrypt backups at rest, restrict access, and monitor job failures. Restore with `pg_restore` into a separate database and verify it before relying on the backup. Do not store backups under the public web root. Scheduling and retention are deployment tasks; the application does not schedule backups itself.

## Operational notes

Use a dedicated least-privilege PostgreSQL account and rotate secrets. Apply migrations in a maintenance window after backing up. Configure HTTPS and a same-origin reverse proxy for the client/API. No load testing, external notification delivery, gateway payment integration, or production penetration review has been completed.

During development, the API permits `http://localhost` and `http://127.0.0.1` on the Vite development port 5173 and preview port 4173, plus private IPv4 addresses assigned to the server computer on those two ports. It also permits the explicitly configured `CLIENT_ORIGIN`. `npm run dev` binds the Vite server to the LAN (`--host 0.0.0.0`); use the computer's current LAN address and port 5173 on another device, and ensure the host firewall only exposes the development port to trusted devices. Do not use a wildcard origin. Restart the API after changing `.env`.

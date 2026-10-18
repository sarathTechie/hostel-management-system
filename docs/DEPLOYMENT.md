# Deployment and operations

## Production build

Run `npm ci`, set production environment variables, run `npm run db:generate`, apply the checked-in migrations with `npm run db:deploy`, then run `npm run build`. Serve the built `client/dist` through a production web server and run the compiled API from `server/dist/src/index.js` (or configure a reverse proxy so `/api` reaches Express).

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: unique random secret (at least 32 characters); keep it in the host secret store.
- `NODE_ENV=production`, `PORT`, `CLIENT_ORIGIN`. Production requires `CLIENT_ORIGIN` to be the exact public client origin; the local development origin allowlist is not enabled in production.
- `SESSION_IDLE_MINUTES` (default 15), `LOGIN_LOCK_MINUTES` (default 15).
- `FEE_OVERDUE_GRACE_DAYS` (default 7; integer from 0 to 3650). An unpaid fee is marked overdue once this many full days have elapsed after its due timestamp.
- `SEED_*_PASSWORD`: development seed values only. Do not seed demo accounts into a production database.

Never commit `.env`. Terminate HTTPS at a trusted reverse proxy/load balancer, forward only trusted headers, and set the public client origin exactly. The API marks session cookies Secure in production.

## Backups

Configure a host scheduler to run a daily PostgreSQL custom-format dump (`pg_dump -Fc`) and retain at least 30 daily copies in protected storage. Encrypt backups at rest, restrict access, and monitor job failures. Restore with `pg_restore` into a separate database and verify it before relying on the backup. Do not store backups under the public web root. Scheduling and retention are deployment tasks; the application does not schedule backups itself.

## Operational notes

Use a dedicated least-privilege PostgreSQL account and rotate secrets. Apply migrations in a maintenance window after backing up. Configure HTTPS and a same-origin reverse proxy for the client/API. No load testing, external notification delivery, gateway payment integration, or production penetration review has been completed.

During development, the API permits `http://localhost` and `http://127.0.0.1` on the Vite development port 5173 and preview port 4173, plus private IPv4 addresses assigned to the server computer on those two ports. It also permits the explicitly configured `CLIENT_ORIGIN`. `npm run dev` binds the Vite server to the LAN (`--host 0.0.0.0`); use the computer's current LAN address and port 5173 on another device, and ensure the host firewall only exposes the development port to trusted devices. Do not use a wildcard origin. Restart the API after changing `.env`.

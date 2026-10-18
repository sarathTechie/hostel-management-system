# Hostel Management System

A browser based hostel operations system based on the approved Version 1.0 SRS in `docs/SRS_Hostel_Management_System.docx`. HMS uses a React and TypeScript client, an Express REST API, Prisma and PostgreSQL. The web app is intended for local use and academic demonstration.

## Current modules

- Shared login with persistent server side sessions, role checks, 15 minute inactivity expiry and configurable lockout after five failed attempts.
- Admin, Accountant and Student roles. Students are restricted to their own fees, receipts, room, complaints, leave requests and feedback endpoints.
- Admin workspace for student records, hostel blocks, rooms, bed allocation/transfer/vacate, and allocation history.
- Fee heads, generated dues, partial and full payments, receipt identifiers, due balances and a configurable seven-day overdue grace period.
- Complaints with dated status history and resolution time, visitor entry/exit, leave decisions with reviewer history, a current-leave view and persisted in-app notifications for request/decision events, weekly meal details and feedback, editable notices and audit events.
- Search and filters for operational lists, server-confirmed logout, role-specific routes and 404 handling.
- Database-derived dashboard metrics and filtered CSV exports for occupancy, fee dues, payments, complaints and leave requests.

Client routes are organized as individual components under `client/src/ui/pages/`. The shared record-page renderer lives in `client/src/ui/RecordPage.tsx`; each record route has its own page component and reuses that renderer.

See `docs/REQUIREMENTS_TRACEABILITY.md` for the audited requirement status and `docs/TESTING.md` for verified coverage and remaining integration checks.

## Technology

React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query/Table, React Hook Form, Zod, Lucide, Recharts, Express, Prisma, PostgreSQL, Argon2id, Vitest, React Testing Library and Supertest.

## Prerequisites

- Node.js 20.19+ or 22.12+ (Node 24 is supported).
- PostgreSQL 14+ running locally or remotely.
- A database and a database user with schema creation permissions.

## Install and configure

```powershell
Copy-Item .env.example .env
npm install
```

Edit `.env` and set `DATABASE_URL` to a PostgreSQL account/database you created, plus a unique `SESSION_SECRET` of at least 32 random characters. The app does not create PostgreSQL users/databases or choose your local database password.

For a local PostgreSQL server where you can connect as its database administrator, create a dedicated user and database (replace the example password):

```sql
CREATE USER hms_user WITH PASSWORD 'a-unique-local-password';
CREATE DATABASE hms OWNER hms_user;
```

Example database URL:

```text
postgresql://hms_user:your_local_password@localhost:5432/hms?schema=public
```

Then generate the Prisma client, apply the database migrations, and seed fictional demonstration data:

```powershell
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

## Run locally

```powershell
npm run dev
```

The client is at `http://localhost:5173`; the API is at `http://localhost:4000/api/v1`. Vite proxies `/api` requests to Express. On another trusted LAN device, use the host computer's LAN IPv4 address with port 5173; the development API permits that server interface origin on the Vite client ports.

## Demo accounts

These credentials are for local development only:

| Role | Username | Default development password |
| --- | --- | --- |
| Admin / Warden | `ADM001` | `1111` |
| Accountant | `ACC001` | `2222` |
| Student | `STU001` | `1234` |

To apply these passwords to the existing local `hostel_management` database without reseeding or changing student, room, allocation, fee or payment data, run `npm run db:demo-passwords`. The command only updates these three local development accounts, stores Argon2id password hashes, and invalidates their current sessions. It refuses to run against production or a non-local database. New demo account rows created by the seed use the same three credentials; other seeded student accounts keep the separate `SEED_STUDENT_PASSWORD` setting. These short passwords are only for local development; do not expose them on a shared network or use them in production. The seed creates fictional demo people and upserts records so repeat runs do not duplicate the demonstration data.

## Quality commands

```powershell
npm run typecheck
npm test
npm run build
```

See [docs/TESTING.md](docs/TESTING.md) for current test scope and database-dependent acceptance steps. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before hosting outside local development.

## Troubleshooting

- `P1000` / password authentication failed: verify the database user/password in `.env` and that the account can connect to the selected database.
- `P1001` / database unreachable: start PostgreSQL and confirm its port and host in `DATABASE_URL`.
- Prisma client errors after schema edits: run `npm run db:generate` again.
- Port already in use: change `PORT` for Express; for Vite update `client/vite.config.ts`.
- If a page looks stale on `http://localhost:4173`, rebuild with `npm run build` and reload the tab; 4173 is the Vite built preview. For source changes with hot reload, run `npm run dev` and open `http://localhost:5173`.
- If writes from the local preview fail with a 403, restart the API after updating it; development permits the 4173 preview and configured `CLIENT_ORIGIN`, while other origins remain blocked.
- Login reports an invalid account after reseeding: run `npm run db:demo-passwords` for the three documented local demo accounts; repeat seed runs do not overwrite existing password hashes.

## Scope exclusions

Third party payment processing, SMS, RFID/biometric attendance and regional language support are SRS TBD/future scope items and are not represented as working modules. Email sending is not configured. No performance target has been load tested.

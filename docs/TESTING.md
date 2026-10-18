# Testing and acceptance

## Commands

```powershell
npm run typecheck
npm test
npm run build
```

## Automated coverage currently present

- Pure rules: fee balance math, currency rounding, overdue/paid classification and leave date range validation.
- Fee overdue grace-period boundaries and the Admin currently-away leave view, including role authorization.
- API security boundary: public health endpoint, unauthenticated business endpoint rejection, exact development/production origin policy, allowed local-origin preflight and rejection of unlisted origins.
- Frontend: login fields and authentication-error display, direct loading of Admin, Help and Student routes, clicking every Admin sidebar destination while checking URL, page heading and active link, Back/Forward navigation, route-specific dialog reset, expired-session redirect, Accountant and Student navigation, a route with query parameters, access denial, unknown-route handling, confirmed logout, safe logout failure handling and account switching.
- Auth API: logout hashes and deletes the cookie's session, clears the cookie, rejects reuse, accepts the configured local frontend origins, and rejects unlisted origins.

## Local verification completed (18 October 2026)

- Prisma client generation and `prisma migrate deploy` succeeded against the existing local `hostel_management` database. The additive `20261018010000_admin_workflow_metadata` migration adds complaint resolution timestamps and leave decision actors; it does not reset or reseed data.
- The three documented development accounts authenticated against the database. Each received its matching role dashboard payload, could access an allowed data endpoint, and had its session invalidated by logout.
- The React Testing Library suite passed (28 tests); server rules, origin-policy and API tests passed (31 tests), including logout invalidation, cookie clearing, origin validation, a simulated serialization conflict, configurable fee grace-period boundaries, Admin current-leave authorization, leave notification transactions, notification ownership and account switching coverage.
- `npm run typecheck` and `npm run build` passed. The built client was served by the local preview on port 4173, and its `/api/v1/health` proxy returned `{"status":"ok"}`.
- The origin failure was reproduced against the existing API: `localhost:4173` and `localhost:5173` reached login validation, while `127.0.0.1` on those ports was rejected. The corrected allowlist is verified by tests; the already-running API process must be restarted to load the rebuilt server.

The Windows browser safety check did not establish a reliable current browser URL, so browser-console inspection and a manual browser click-through were not performed. Port inspection confirmed listeners on 4000 (Node API), 4173 (preview), 4174 (another preview), 5173 (Vite dev), and 5433 (PostgreSQL). The previous running API returned 401 for logout without a valid session; source inspection showed the handler was behind `requireAuth`. It also only accepted the configured 5173 origin, while the active preview was 4173. Logout now runs before auth gating, deletes the matching hashed session when present, clears the cookie, allows the local 4173 preview in development and rejects other origins. Live API checks confirmed logout, cookie clearing and rejection of session reuse; Admin-to-Accountant session switching also passed. Direct nested preview URLs returned the SPA entry page, and automated route tests verified the matching in-app destinations. The previously reported stale page could not be reproduced in a live browser during this pass. Database-backed write workflows (allocation, payment, visitor, leave, complaint, notice and menu mutations) were not exercised in this verification pass to preserve existing demo records and payments.

The automated suite does not yet provide database-backed integration coverage for the full SRS. In particular, login lockout, session expiration, concurrent bed allocation, payment receipt persistence, report contents and UI mutation flows still need dedicated integration tests.

## Manual acceptance checklist

1. Create a local PostgreSQL database/user and set `DATABASE_URL`; run Prisma migration and seed.
2. Sign in as each of `ADM001`, `ACC001` and `STU001`; verify role-specific navigation and logout.
3. Create a student; configure a block/floor/room/beds; allocate, transfer and vacate beds. Confirm the original allocation remains in history and the bed states remain consistent.
4. Apply a fee head to current residents; record partial then full payment; verify the balance and unique receipt number; attempt overpayment and confirm rejection.
5. Submit complaints and leave requests as the student, then review them as Admin. Confirm student records remain private across account sessions.
6. Check visitor entry/exit, publish a menu and notice, submit meal feedback, and exclude expired notices.
7. Download each CSV report and confirm role restrictions and active filters.
8. Verify backup/restore with the actual deployment database before real data is entered.

Performance targets from the prompt and SRS have not been load tested. A passing build or unit test does not demonstrate production security or 300-user capacity.

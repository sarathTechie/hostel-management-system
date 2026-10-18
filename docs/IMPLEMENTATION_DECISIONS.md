# Implementation decisions

Decisions are based on the approved SRS plus the development requirements in the project prompt. Institution policies that remain TBD are kept configurable and are not presented as institutional facts.

| Topic | Decision | Basis / status |
| --- | --- | --- |
| Data store | PostgreSQL 14+ with Prisma and normalized relational models. | The project prompt requires PostgreSQL; the SRS allows a relational DBMS. |
| User roles | Implement Admin/Warden, Accountant and Student. Keep IT administration as infrastructure/deployment work, without an application business role. | The SRS calls IT a non-business role; detailed authorization describes the three business roles. |
| Passwords | Argon2id hashes. Demo credentials are read from seed environment variables; defaults are for local demonstration only. | Required secure password storage; no production credential is embedded in application logic. |
| Session lifetime | 15 minutes idle; cookie is HttpOnly, SameSite=Lax and Secure in production. Session rows are stored server side. | Explicit development target in the project prompt. |
| Login lockout | Five consecutive failed attempts lock the account for 15 minutes by default. `LOGIN_LOCK_MINUTES` configures the duration. | SRS requires a configurable cool-down but leaves its duration unspecified. |
| Fee overdue status | A balance above zero is overdue when its due date is before the current server date/time. | The SRS leaves the grace period TBD. This default is direct due-date comparison, not an asserted hostel policy. |
| Fee credit/refund | Payments may not exceed the open due. Refunds and credits are outside the current model. | The prompt requires overpayment prevention unless a credit policy is explicitly established. |
| Room transfer | In one database transaction, close the previous allocation, release its bed, occupy the new bed and create a new allocation history row. | Preserves history and bed state together. A partial unique index is required for concurrent allocation protection. |
| Roommates | Student room visibility is limited to the student's own allocation; roommate visibility is not enabled. | The SRS says roommates may be shown if configured; no institutional configuration was supplied. |
| Complaint status | Open → In Progress → Resolved is supported; resolution requires a remark. Status history is append-only. | SRS defines statuses and requires status change timestamps. |
| Notifications | In-app state is available through API responses and refreshed queries. SMS and email delivery are not configured. | SMS is TBD; no SMTP provider is supplied. |
| Mess attendance | Not implemented. | SRS marks opt-in/opt-out tracking desirable and optional. |
| Online payment, RFID, localization | Deferred. | Explicit SRS Appendix C TBD items. |
| Exports | CSV for occupancy, fee dues and complaints, filtered where applicable. | Common format is allowed by SRS; PDFs are not required for the selected first pass. |
| Demo data | Fictional and deterministic identities; seed is safe to rerun. | User prompt requires repeatable demonstration data. |

## Known unresolved items

- SRS Appendix C does not specify the overdue grace period, peak concurrency count, regional languages, payment gateway, SMS, RFID, or mess attendance decision.
- The institution handbook and privacy rules cited by the SRS were not included in the repository. Defaults above must be reviewed by the institution before production use.
- Deployment HTTPS termination, backup schedule, and retention must be configured by the host environment.

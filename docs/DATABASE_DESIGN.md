# Database design

The canonical schema is `server/prisma/schema.prisma`; migrations live under `server/prisma/migrations`. PostgreSQL is the only persistent store. Prisma accesses it only from the API server.

## Entities and relationships

- `User` owns one optional `Student` profile, multiple `Session` rows, notice/menu authoring and audit events.
- `HostelBlock` contains `Floor` and `Room`; rooms contain `Bed` rows.
- `Allocation` joins a student to a bed with allocation and vacated timestamps, preserving past room history.
- `FeeStructure` creates per-student `FeeDue` records. `Payment` rows link to dues and carry unique receipt numbers.
- `Complaint` belongs to a student and has append-only `ComplaintStatusHistory` rows.
- `Visitor`, `LeaveRequest`, `MessMenu`, `MessMenuEntry`, `MessFeedback`, `Notice`, and `AuditLog` cover the remaining operational records.

## Important constraints and indexes

- Usernames, roll numbers, block names, room numbers within a block, bed numbers within a room, student/fee pairs, menu week starts, menu entry date/meal pairs, student feedback per entry, and receipt numbers are unique.
- Foreign keys use restrictive deletion for student, allocation, payment, complaint and audit history to avoid removing financial or operational history by deleting a parent record. Sessions and menu entries can cascade with their owner records.
- Money uses PostgreSQL `Decimal(12,2)`; dates, statuses and frequently filtered foreign keys are indexed.
- Allocate, transfer, vacate, generate dues and record payment use database transactions.
- The schema's Prisma unique constraints cannot represent “only one active allocation per student/bed.” The initial migration adds PostgreSQL partial unique indexes on `Allocation(studentId) WHERE vacatedAt IS NULL` and `Allocation(bedId) WHERE vacatedAt IS NULL`. Do not rely on application checks alone under concurrent traffic.

## Balance calculation

Outstanding balance is derived as the fee due amount minus all payments recorded against it. It is not stored as a second mutable balance. An overpayment is rejected in the payment transaction and by a PostgreSQL trigger that locks the due row before summing payments. Overdue is computed from the balance and due date using the development policy in `IMPLEMENTATION_DECISIONS.md`.

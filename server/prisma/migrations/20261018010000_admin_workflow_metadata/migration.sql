ALTER TABLE "Complaint" ADD COLUMN "resolvedAt" TIMESTAMP(3);
ALTER TABLE "LeaveRequest" ADD COLUMN "decidedById" TEXT;

UPDATE "Complaint" AS complaint
SET "resolvedAt" = COALESCE(
  (SELECT MAX(history."createdAt")
   FROM "ComplaintStatusHistory" AS history
   WHERE history."complaintId" = complaint."id"
     AND history."status" = 'RESOLVED'),
  complaint."updatedAt"
)
WHERE complaint."status" = 'RESOLVED';

CREATE INDEX "LeaveRequest_decidedById_idx" ON "LeaveRequest"("decidedById");
ALTER TABLE "LeaveRequest"
ADD CONSTRAINT "LeaveRequest_decidedById_fkey"
FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

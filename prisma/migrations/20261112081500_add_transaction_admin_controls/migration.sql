-- Add audit fields for controlled historical transaction management.
ALTER TABLE "transactions"
  ADD COLUMN "editedAt" TIMESTAMP(3),
  ADD COLUMN "editedBy" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "transactions_deletedAt_idx" ON "transactions"("deletedAt");

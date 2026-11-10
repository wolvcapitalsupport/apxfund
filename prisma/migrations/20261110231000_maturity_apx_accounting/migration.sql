-- Maturity-only APX accounting.
-- This migration is intentionally additive and does not touch production data.
-- Existing active investments with prior ROI processing are flagged for manual
-- reconciliation so their already-paid USD/APX portions cannot be paid again.

ALTER TABLE "investments"
  ADD COLUMN "legacyRoiPaidUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "legacyRoiReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "roiPaidUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "roiPaidApx" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "principalReturnedUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "maturityProcessedAt" TIMESTAMP(3);

ALTER TABLE "transactions"
  ADD COLUMN "investmentId" TEXT;

ALTER TABLE "roi_processing_logs"
  ADD COLUMN "totalApxPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "totalUsdPrincipalReturned" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX "transactions_investmentId_idx" ON "transactions"("investmentId");

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_investmentId_fkey"
  FOREIGN KEY ("investmentId") REFERENCES "investments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- A non-null lastRoiProcessedAt means an investment has passed through the
-- pre-maturity processor. Require an explicit reconciliation before the new
-- processor can settle it. No balance or ledger rows are modified here.
UPDATE "investments"
SET "legacyRoiReviewRequired" = true
WHERE "status" = 'ACTIVE' AND "lastRoiProcessedAt" IS NOT NULL;

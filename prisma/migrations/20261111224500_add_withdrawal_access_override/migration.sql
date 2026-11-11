-- Add a targeted administrative override without changing investment status or balances.
ALTER TABLE "users"
ADD COLUMN "withdrawalAccessOverride" BOOLEAN NOT NULL DEFAULT false;

-- Administrative exception requested for this specific account.
UPDATE "users"
SET "withdrawalAccessOverride" = true
WHERE LOWER("email") = LOWER('joerg_schneider@mnet-online.de');

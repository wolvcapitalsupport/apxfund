-- CreateEnum
CREATE TYPE "ApxWithdrawalStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- CreateTable
CREATE TABLE "apx_withdrawals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'BSC',
    "status" "ApxWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apx_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "apx_withdrawals_transactionId_key" ON "apx_withdrawals"("transactionId");
CREATE INDEX "apx_withdrawals_status_idx" ON "apx_withdrawals"("status");
CREATE INDEX "apx_withdrawals_userId_requestedAt_idx" ON "apx_withdrawals"("userId", "requestedAt");

-- AddForeignKey
ALTER TABLE "apx_withdrawals" ADD CONSTRAINT "apx_withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "apx_withdrawals" ADD CONSTRAINT "apx_withdrawals_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

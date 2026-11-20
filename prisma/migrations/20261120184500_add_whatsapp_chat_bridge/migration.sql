CREATE TYPE "ChatSender" AS ENUM ('VISITOR', 'ADMIN');
CREATE TYPE "UnroutedMessageStatus" AS ENUM ('OPEN', 'REVIEWED');

CREATE TABLE "chat_sessions" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "visitorName" TEXT NOT NULL,
  "visitorPhone" TEXT NOT NULL,
  "pageUrl" TEXT,
  "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + interval '30 days'),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chat_sessions_token_key" ON "chat_sessions"("token");
CREATE INDEX "chat_sessions_expiresAt_idx" ON "chat_sessions"("expiresAt");

CREATE TABLE "chat_messages" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "sender" "ChatSender" NOT NULL,
  "body" TEXT NOT NULL,
  "wamid" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chat_messages_wamid_key" ON "chat_messages"("wamid");
CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "chat_messages"("sessionId", "createdAt");
CREATE INDEX "chat_messages_wamid_idx" ON "chat_messages"("wamid");
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "unrouted_admin_messages" (
  "id" TEXT NOT NULL,
  "wamid" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "contextWamid" TEXT,
  "status" "UnroutedMessageStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "unrouted_admin_messages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "unrouted_admin_messages_wamid_key" ON "unrouted_admin_messages"("wamid");
CREATE INDEX "unrouted_admin_messages_status_createdAt_idx" ON "unrouted_admin_messages"("status", "createdAt");

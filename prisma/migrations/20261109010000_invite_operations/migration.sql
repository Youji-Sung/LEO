ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN "provisioned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "credentialVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';
CREATE TABLE "AccountInvitation" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AccountInvitation_tokenHash_key" ON "AccountInvitation"("tokenHash");
CREATE INDEX "AccountInvitation_userId_idx" ON "AccountInvitation"("userId");
CREATE TABLE "AuditEvent" ("id" TEXT NOT NULL PRIMARY KEY, "action" TEXT NOT NULL, "userId" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "ApiReservation" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "feature" TEXT NOT NULL,
  "amountMicros" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "ApiReservation_status_userId_idx" ON "ApiReservation"("status", "userId");
CREATE TABLE "LoginAttempt" ("key" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" DATETIME NOT NULL);
CREATE TABLE "RuntimeControl" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL);
CREATE TABLE "ReportJob" ("conversationId" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "status" TEXT NOT NULL, "error" TEXT, "updatedAt" DATETIME NOT NULL);

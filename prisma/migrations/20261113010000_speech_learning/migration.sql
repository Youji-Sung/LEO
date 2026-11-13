ALTER TABLE "Conversation" ADD COLUMN "openingLine" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "learningTargets" TEXT;
ALTER TABLE "Message" ADD COLUMN "speech" TEXT;
ALTER TABLE "UserSettings" ADD COLUMN "speechTerms" TEXT NOT NULL DEFAULT '';
CREATE TABLE "LearningItem" (
  "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "sourceConversationId" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL, "phrase" TEXT NOT NULL, "original" TEXT NOT NULL,
  "explanation" TEXT NOT NULL, "example" TEXT NOT NULL, "stage" INTEGER NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0, "dueAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAnswer" TEXT NOT NULL DEFAULT '', "lastOutcome" TEXT, "lastUsedAt" DATETIME,
  "lastUseConversationId" TEXT, "lastUseText" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("sourceConversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LearningItem_userId_sourceKey_key" ON "LearningItem"("userId", "sourceKey");
CREATE INDEX "LearningItem_userId_dueAt_idx" ON "LearningItem"("userId", "dueAt");

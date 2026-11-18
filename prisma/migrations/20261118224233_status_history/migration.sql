-- CreateTable
CREATE TABLE "WaitlistStatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "adminId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaitlistStatusEvent_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "WaitlistEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WaitlistStatusEvent_entryId_createdAt_idx" ON "WaitlistStatusEvent"("entryId", "createdAt");

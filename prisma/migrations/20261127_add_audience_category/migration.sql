ALTER TABLE "WaitlistEntry" ADD COLUMN "audienceCategory" TEXT NOT NULL DEFAULT 'OTHER';
UPDATE "WaitlistEntry" SET "audienceCategory" = CASE WHEN "role" = 'BRAND' THEN 'BUSINESS' ELSE 'OTHER' END;
CREATE INDEX "WaitlistEntry_audienceCategory_status_createdAt_idx" ON "WaitlistEntry"("audienceCategory", "status", "createdAt");

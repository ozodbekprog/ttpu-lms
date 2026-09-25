CREATE TYPE "BugStatus" AS ENUM ('NEW', 'IN_REVIEW', 'FIXED', 'REJECTED');

CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "url" TEXT,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "meta" JSONB,
    "status" "BugStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BugReport_status_createdAt_idx" ON "BugReport"("status", "createdAt");

ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

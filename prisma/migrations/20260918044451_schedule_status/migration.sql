-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('NORMAL', 'CHANGED', 'MOVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ScheduleEntry" ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" "ScheduleStatus" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

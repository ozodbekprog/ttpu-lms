-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "curatorId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionEpoch" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Group_curatorId_idx" ON "Group"("curatorId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_curatorId_fkey" FOREIGN KEY ("curatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

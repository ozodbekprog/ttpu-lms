-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

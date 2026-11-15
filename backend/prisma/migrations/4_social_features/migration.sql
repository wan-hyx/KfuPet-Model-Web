-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POST_COMMENT', 'COMMENT_REPLY', 'MODEL_APPROVED', 'MODEL_REJECTED', 'MODEL_DELISTED', 'MODEL_RESTORED');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "favoriteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PostModel" (
    "postId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "PostModel_pkey" PRIMARY KEY ("postId","modelId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostModel_modelId_idx" ON "PostModel"("modelId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "PostModel" ADD CONSTRAINT "PostModel_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostModel" ADD CONSTRAINT "PostModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

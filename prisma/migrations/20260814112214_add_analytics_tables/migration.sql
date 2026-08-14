-- CreateEnum
CREATE TYPE "AnalyticsResourceType" AS ENUM ('page', 'product', 'news', 'solution', 'case', 'contact');

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsPageView" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "resourceType" "AnalyticsResourceType" NOT NULL,
    "resourceId" TEXT,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsPageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSession_sessionId_key" ON "AnalyticsSession"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_visitorId_idx" ON "AnalyticsSession"("visitorId");

-- CreateIndex
CREATE INDEX "AnalyticsSession_startedAt_idx" ON "AnalyticsSession"("startedAt");

-- CreateIndex
CREATE INDEX "AnalyticsSession_isBot_idx" ON "AnalyticsSession"("isBot");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsPageView_eventId_key" ON "AnalyticsPageView"("eventId");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_sessionId_idx" ON "AnalyticsPageView"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_visitorId_idx" ON "AnalyticsPageView"("visitorId");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_resourceType_createdAt_idx" ON "AnalyticsPageView"("resourceType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_resourceType_resourceId_createdAt_idx" ON "AnalyticsPageView"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsPageView_createdAt_idx" ON "AnalyticsPageView"("createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsPageView" ADD CONSTRAINT "AnalyticsPageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: SearchQuery (GSC search performance data)
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'global',
    "device" TEXT NOT NULL DEFAULT 'all',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RankingSnapshot (keyword ranking tracking)
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "position" INTEGER,
    "previousPosition" INTEGER,
    "change" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'GSC',
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SearchTrend (weekly trend aggregation)
CREATE TABLE "SearchTrend" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'internal',
    "count" INTEGER NOT NULL DEFAULT 0,
    "previousCount" INTEGER,
    "growth" DOUBLE PRECISION,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AlertEvent (SEO alerts)
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL DEFAULT '',
    "data" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- Indexes: SearchQuery
CREATE INDEX "SearchQuery_query_idx" ON "SearchQuery"("query");
CREATE INDEX "SearchQuery_snapshotAt_idx" ON "SearchQuery"("snapshotAt");
CREATE UNIQUE INDEX "SearchQuery_query_country_device_snapshotAt_key" ON "SearchQuery"("query", "country", "device", "snapshotAt");

-- Indexes: RankingSnapshot
CREATE INDEX "RankingSnapshot_keyword_idx" ON "RankingSnapshot"("keyword");
CREATE INDEX "RankingSnapshot_snapshotAt_idx" ON "RankingSnapshot"("snapshotAt");
CREATE UNIQUE INDEX "RankingSnapshot_keyword_url_snapshotAt_key" ON "RankingSnapshot"("keyword", "url", "snapshotAt");

-- Indexes: SearchTrend
CREATE INDEX "SearchTrend_query_idx" ON "SearchTrend"("query");
CREATE INDEX "SearchTrend_weekStart_idx" ON "SearchTrend"("weekStart");
CREATE UNIQUE INDEX "SearchTrend_query_source_weekStart_key" ON "SearchTrend"("query", "source", "weekStart");

-- Indexes: AlertEvent
CREATE INDEX "AlertEvent_type_idx" ON "AlertEvent"("type");
CREATE INDEX "AlertEvent_resolved_idx" ON "AlertEvent"("resolved");

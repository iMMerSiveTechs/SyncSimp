-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'ios',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "appleIssuerId" TEXT,
    "appleKeyId" TEXT,
    "appleP8FileContent" TEXT,
    "appleIapKeyId" TEXT,
    "appleIapP8Content" TEXT,
    "revenueCatApiKey" TEXT,
    "revenueCatProjectId" TEXT,
    "revenueCatIosAppId" TEXT,
    "configYaml" TEXT,
    "lastSyncAt" DATETIME,
    "lastCheckAt" DATETIME,
    "syncStatus" TEXT DEFAULT 'not_synced'
);

-- CreateTable
CREATE TABLE "plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "appleProductId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" TEXT,
    "entitlement" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "introOfferType" TEXT,
    "introOfferDuration" TEXT,
    "rcOffering" TEXT NOT NULL,
    "rcPackageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "plan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sync_log_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

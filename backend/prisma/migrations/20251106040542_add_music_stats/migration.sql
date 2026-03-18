-- CreateTable
CREATE TABLE "artist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "genre" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "releaseYear" INTEGER,
    "genre" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "coverUrl" TEXT,
    "genre" TEXT,
    "trackNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "song_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "song_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "album" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "play_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "songId" TEXT,
    "albumId" TEXT,
    "artistId" TEXT,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "deviceType" TEXT,
    "platform" TEXT,
    CONSTRAINT "play_stats_songId_fkey" FOREIGN KEY ("songId") REFERENCES "song" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "play_stats_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "play_stats_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "play_stats_userId_playedAt_idx" ON "play_stats"("userId", "playedAt");

-- CreateIndex
CREATE INDEX "play_stats_songId_playedAt_idx" ON "play_stats"("songId", "playedAt");

-- CreateIndex
CREATE INDEX "play_stats_albumId_playedAt_idx" ON "play_stats"("albumId", "playedAt");

-- CreateIndex
CREATE INDEX "play_stats_artistId_playedAt_idx" ON "play_stats"("artistId", "playedAt");

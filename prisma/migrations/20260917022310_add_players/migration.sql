-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "searchFullName" TEXT,
    "position" TEXT,
    "team" TEXT,
    "fantasyPositions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT,
    "injuryStatus" TEXT,
    "age" INTEGER,
    "yearsExp" INTEGER,
    "number" INTEGER,
    "active" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSnapshot" (
    "id" TEXT NOT NULL,
    "capturedOn" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Player_team_idx" ON "Player"("team");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_searchFullName_idx" ON "Player"("searchFullName");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSnapshot_capturedOn_key" ON "PlayerSnapshot"("capturedOn");

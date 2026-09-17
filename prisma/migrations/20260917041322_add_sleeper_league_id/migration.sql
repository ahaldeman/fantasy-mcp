/*
  Warnings:

  - Added the required column `sleeperLeagueId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sleeperLeagueId" TEXT NOT NULL;

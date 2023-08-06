/*
  Warnings:

  - You are about to drop the column `deliveryCount` on the `User` table. All the data in the column will be lost.
  - Added the required column `packageCount` to the `Delivery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "packageCount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deliveryCount";

/*
  Warnings:

  - Added the required column `additionalPackageCost` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseCost` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distanceCost` to the `Delivery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "additionalPackageCost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "baseCost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "distanceCost" DOUBLE PRECISION NOT NULL;

/*
  Warnings:

  - You are about to alter the column `cost` on the `Delivery` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `base` on the `FixedPrices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `additionalPackage` on the `FixedPrices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `start` on the `VariablePrices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `end` on the `VariablePrices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `cost` on the `VariablePrices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Delivery" ALTER COLUMN "cost" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FixedPrices" ALTER COLUMN "base" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "additionalPackage" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "VariablePrices" ALTER COLUMN "start" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "end" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "cost" SET DATA TYPE DOUBLE PRECISION;

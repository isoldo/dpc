-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "deliveryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedPrices" (
    "id" SERIAL NOT NULL,
    "active" BOOLEAN NOT NULL,
    "base" DECIMAL(10,2) NOT NULL,
    "additionalPackage" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "FixedPrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariablePrices" (
    "start" DECIMAL(10,2) NOT NULL,
    "end" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_id_key" ON "Admin"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_id_key" ON "Delivery"("id");

-- CreateIndex
CREATE INDEX "FixedPrices_active_idx" ON "FixedPrices" USING HASH ("active");

-- CreateIndex
CREATE UNIQUE INDEX "VariablePrices_start_end_key" ON "VariablePrices"("start", "end");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

import { FixedPrices, PrismaClient, VariablePrices } from "@prisma/client";

const prismaClient = new PrismaClient();

export async function fetchFixedPrices(): Promise<FixedPrices | null> {
  const response = await prismaClient.fixedPrices.findMany({ where: { active: true } });
  if (response.length) {
    return response[0];
  }

  return null;
}

export async function fetchVariablePrices(): Promise<VariablePrices[]> {
  return await prismaClient.variablePrices.findMany();
}

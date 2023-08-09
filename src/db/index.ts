import { FixedPrices, PrismaClient, User, VariablePrices } from "@prisma/client";
import { DeliveryParameters } from "../delivery/index.js";

const prismaClient = new PrismaClient();

export async function fetchFixedPrices(): Promise<FixedPrices | null> {
  const response = await prismaClient.fixedPrices.findMany({ where: { active: true } });
  if (response.length) {
    return response[0];
  }

  return null;
}

export async function fetchVariablePrices(): Promise<VariablePrices[] | null> {
  const response = await prismaClient.variablePrices.findMany();
  if (response.length) {
    return response;
  }

  return null;
}

export async function fetchUserByMail(email: string): Promise<User | null> {
  return await prismaClient.user.findUnique({ where: { email }});
}

export async function createUser(email: string, phone: string, name: string, lastName: string) {
  return await prismaClient.user.create({ data: {
    email,
    phone,
    name,
    lastName
  }});
}

interface FixedPricesParams {
  base: number;
  additionalPackage: number;
}

export async function updateFixedPrices(params: FixedPricesParams) {
  try {
    const result = await prismaClient.$transaction( async (pc) => {
      const activeRow = await pc.fixedPrices.findMany({ where: { active: true } });
      const activeIds = activeRow.map( row => row.id);
      const newRecord = await pc.fixedPrices.create({
        data: {
          ...params,
          active: true
        }
      });
      // just in case there were multiple active fixed costs records
      await pc.fixedPrices.updateMany(
        {
          where: { id: { in: activeIds } },
          data: { active: false }
        }
      );
      return newRecord;
    });

    return result;
  } catch (e) {
    const err = e as Error;
    console.error(`>>>>>> Error: ${err.message}`);
    return null;
  }
}

export async function updateVariablePrices(sortedData: VariablePrices[]) {
  return await prismaClient.$transaction( async (pc) => {
    await pc.variablePrices.deleteMany();
    return await pc.variablePrices.createMany( {
      data: sortedData
    })
  });
}

export async function createDelivery(params: DeliveryParameters) {
  return await prismaClient.delivery.create({ data: params });
}

export async function isAdmin(email: string, passwordHash: string): Promise<boolean> {
  const data = await prismaClient.admin.findMany({ where: {
    email,
    passwordHash
  }});

  return !!data.length;
}

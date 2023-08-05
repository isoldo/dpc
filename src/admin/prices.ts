import { FixedPrices, PrismaClient, VariablePrices } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();

export async function handlePrices(req: express.Request, res: express.Response, id?: string) {
  if (req.method === "GET" ) {
    return handleGetPrices(req, res, id);
  } else if (req.method === "PUT") {
    return handlePutPrices(req, res, id);
  }

  return res.status(405).json({ code: 405, message: `Unsupported method: ${req.method}`});
}

async function handleGetPrices(req: express.Request, res: express.Response, id?: string) {
  if (!id) {
    return res.status(400).json({ error: {code: 400, message: "Missing type" } });
  }

  if (id === "fixed") {
    return handleGetFixedPrices(req, res);
  } else if (id === "variable") {
    return handleGetVariablePrices(req, res);
  }

  return res.status(400).json({ error: {code: 400, message: `Unsupported type: ${id}` } });
}

async function handlePutPrices(req: express.Request, res: express.Response, id?: string) {
  if (!id) {
    return res.status(400).json({ error: { code: 400, message: "Missing type" } });
  }

  if (id === "fixed") {
    return handlePutFixedPrices(req, res);
  } else if (id === "variable") {
    return handlePutVariablePrices(req, res);
  }

  return res.status(400).json({ error: {code: 400, message: `Unsupported type: ${id}` } });
}

async function handleGetFixedPrices(_req: express.Request, res: express.Response) {
  const fixedCosts = await prisma.fixedPrices.findMany({
    where: {
      active: true
    }
  });
  if (fixedCosts.length) {
    if (fixedCosts.length > 1) {
      console.warn(`Database error: more than one active fixed costs entry (${fixedCosts.length})`);
    }
    return res.status(200).json({ fixedCosts });
  }
  return res.status(500).json({ error: { code: 500, message: "No active fixed costs entry in the DB" } });
}

async function handleGetVariablePrices(_req: express.Request, res: express.Response) {
  const variableCosts = await prisma.variablePrices.findMany();
  return res.status(200).json({ variableCosts });
}

async function handlePutFixedPrices(req: express.Request, res: express.Response) {
  const params: FixedPrices = req.body;
    console.debug({params});

    if (!params.base || !params.additionalPackage) {
      return res.status(400).json({ error: { code: 400, message: "Incomplete body" } });
    }

    const result = await updateFixedCosts(params);
    console.debug({ result });

    if (result) {
      return res.status(200).json({ result });
    }

    return res.status(500).json({ code: 500, message: "Error updating fixed prices" });
}

async function updateFixedCosts(params: FixedPrices) {
  const result = await prisma.$transaction( async (pc) => {
    const activeRow = await pc.fixedPrices.findMany({ where: { active: true } });
    const activeIds = activeRow.map( row => row.id);
    const newRecord = await pc.fixedPrices.create({
      data: {
        base: params.base,
        additionalPackage: params.additionalPackage,
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
}


async function handlePutVariablePrices(req: express.Request, res: express.Response) {
  const data: VariablePrices[] = req.body;

  console.debug({ data });

  try {
    for (const vp of data) {
      console.debug({ vp });
      const paramCheck = !isNaN(vp.start) && !isNaN(vp.end) && !isNaN(vp.cost);
      console.debug({ start: vp.start });
      console.debug({ end: vp.end });
      console.debug({ cost: vp.cost });

      if (!paramCheck) {
        return res.status(400).json({ error: { code: 400, message: "Invalid params" } });
      }
    }
  } catch (e) {
    console.error(`>>>>>> ERROR: ${(e as Error).message}`);
    return res.status(500).json({ error: { code: 500, message: "Internal server error" } });
  }

  const result = await prisma.$transaction( async (pc) => {
    await pc.variablePrices.deleteMany();
    return await pc.variablePrices.createMany( {
      data
    })
  });

  if (result) {
    return res.status(200).json({ result });
  }

  return res.status(500).json({ code: 500, message: "Error updating variable prices"})
}

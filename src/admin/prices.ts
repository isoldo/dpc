import { PrismaClient, VariablePrices } from "@prisma/client";
import express from "express";
import { fetchFixedPrices, fetchVariablePrices, updateFixedPrices, updateVariablePrices } from "../db/index.js";
import { errorFactory } from "../utils/errorFactory.js";

const prisma = new PrismaClient();

export async function handlePrices(req: express.Request, res: express.Response, id?: string) {
  if (req.method === "GET" ) {
    return handleGetPrices(req, res, id);
  } else if (req.method === "PUT") {
    return handlePutPrices(req, res, id);
  }

  return errorFactory(res, 405, `Unsupported method: ${req.method}`);
}

async function handleGetPrices(req: express.Request, res: express.Response, id?: string) {
  if (!id) {
    return errorFactory(res, 400, "Missing type");
  }

  if (id === "fixed") {
    return handleGetFixedPrices(req, res);
  } else if (id === "variable") {
    return handleGetVariablePrices(req, res);
  }

  return errorFactory(res, 400, `Unsupported type: ${id}`);
}

async function handlePutPrices(req: express.Request, res: express.Response, id?: string) {
  if (!id) {
    return errorFactory(res, 400, "Missing type");
  }

  if (id === "fixed") {
    return handlePutFixedPrices(req, res);
  } else if (id === "variable") {
    return handlePutVariablePrices(req, res);
  }

  return errorFactory(res, 400, `Unsupported type: ${id}`);
}

async function handleGetFixedPrices(_req: express.Request, res: express.Response) {
  try {
    const data = await fetchFixedPrices();
    if (data) {
      return res.status(200).json({ data });
    }
    return errorFactory(res, 404, "No fixed price entries found");
  } catch (e) {
    const err = e as Error;
    console.error(`>>>>>> ERROR: ${err.message}`);
    return errorFactory(res, 500, "Error fetching fixed prices");
  }
}

async function handleGetVariablePrices(_req: express.Request, res: express.Response) {
  try {
    const data = await fetchVariablePrices();
    if (data) {
      return res.status(200).json({ data });
    }
    return errorFactory(res, 404, "No variable price entries found")
  } catch (e) {
    const err = e as Error;
    console.error(`>>>>>> ERROR: ${err.message}`);
    return errorFactory(res, 500, "Error fetching variable prices");
  }
}

async function handlePutFixedPrices(req: express.Request, res: express.Response) {
  const { base, additionalPackage } = req.body;
  console.debug({ base, additionalPackage });

  if (isNaN(base) || isNaN(additionalPackage)) {
    return errorFactory(res, 400, "Incomplete body");
  }

  if (base < 0 || additionalPackage < 0) {
    return errorFactory(res, 400, "Prices must not be negative");
  }

  const data = await updateFixedPrices({ base, additionalPackage });
  console.debug({ data });

  if (data) {
    return res.status(200).json({ data });
  }

  return errorFactory(res, 500, "Error updating fixed prices");
}

async function handlePutVariablePrices(req: express.Request, res: express.Response) {
  const newPrices: VariablePrices[] = req.body;

  console.debug({ newPrices });

  if (!newPrices.length) {
    return errorFactory(res, 400, "Missing params");
  }

  try {
    for (const vp of newPrices) {
      const paramCheck = !isNaN(vp.start) && !isNaN(vp.end) && !isNaN(vp.cost);

      if (!paramCheck) {
        return errorFactory(res, 400, "Invalid params");
      }
    }
  } catch (e) {
    const err = e as Error;
    console.error(`>>>>>> ERROR: ${err.message}`);
    return errorFactory(res, 500, "Internal server error")
  }

  const sortedData = [...newPrices].sort((a, b) => a.start - b.start);

  if (!isExhaustive(sortedData)) {
    return errorFactory(res, 400, "Input not exhaustive");
  }

  if (!isContiguous(sortedData)) {
    return errorFactory(res, 400, "Input not contiguous");
  }

  const data = await updateVariablePrices(sortedData);
  if (data) {
    return res.status(200).json({ data });
  }

  return errorFactory(res, 500, "Error updating variable prices");
}

function isContiguous(sortedData: VariablePrices[]): boolean {
  console.debug({ sortedData });

  let end = sortedData[0].end;

  for (let i = 1; i < sortedData.length; i++) {
    if ( end !== sortedData[i].start) {
      return false;
    }
    end = sortedData[i].end;
  }

  return true;
}

function isExhaustive(sortedData: VariablePrices[]): boolean {
  return !(sortedData[0].start !== 0.0 || sortedData[sortedData.length-1].end !== -1.0);
}

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

  const sortedData = variablePricesParamCheck(res, newPrices);
  if (!sortedData) {
    // res is already set, just return
    return;
  }

  const data = await updateVariablePrices(sortedData);
  if (data) {
    return res.status(200).json({ data });
  }

  return errorFactory(res, 500, "Error updating variable prices");
}

function variablePricesParamCheck(res: express.Response, params: VariablePrices[]): VariablePrices[] | null {
  if (!params.length) {
    errorFactory(res, 400, "Missing params");
    return null;
  }

  try {
    for (const vp of params) {
      const paramCheck = !isNaN(vp.start) && !isNaN(vp.cost);

      if (!paramCheck) {
        errorFactory(res, 400, "Invalid params");
        return null;
      }

      if (vp.end !== undefined && vp.end !== -1.0 && vp.end < vp.start) {
        console.warn(`Senseless interval ${vp.start}-${vp.end}. Swapping`);
        [vp.start, vp.end] = [vp.end, vp.start];
      }

      if (vp.end === undefined) {
        vp.end = -1;
      }
    }
  } catch (e) {
    const err = e as Error;
    console.error(`>>>>>> ERROR: ${err.message}`);
    errorFactory(res, 500, "Internal server error");
    return null;
  }

  const sortedData = [...params].sort((a, b) => a.start - b.start);

  if (!isExhaustive(sortedData)) {
    errorFactory(res, 400, "Input not exhaustive");
    return null;
  }

  if (!isContiguous(sortedData)) {
    errorFactory(res, 400, "Input not contiguous");
    return null;
  }

  return sortedData;
}

export function isContiguous(sortedData: VariablePrices[]): boolean {
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

export function isExhaustive(sortedData: VariablePrices[]): boolean {
  return !(sortedData[0].start !== 0.0 || sortedData[sortedData.length-1].end !== -1.0);
}

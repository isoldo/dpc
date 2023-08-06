import { PrismaClient, VariablePrices } from "@prisma/client";
import express from "express";
import { fetchFixedPrices, fetchVariablePrices, updateFixedPrices, updateVariablePrices } from "../db/index.js";

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
  try {
    const data = await fetchFixedPrices();
    if (data) {
      return res.status(200).json({ data });
    }
    return res.status(404).json({ error: { code: 404, message: "No fixed price entries found" } });
  } catch (e) {
    const err = e as Error;
    console.error(err.message);
    return res.status(500).json({ error: { code: 500, message: "Error fetching fixed prices" } });
  }
}

async function handleGetVariablePrices(_req: express.Request, res: express.Response) {
  try {
    const data = await fetchVariablePrices();
    if (data) {
      return res.status(200).json({ data });
    }
    return res.status(400).json({ error: { code: 404, message: "No variable price entries found" } });
  } catch (e) {
    const err = e as Error;
    console.error(`>>>>>> ERROR: ${err.message}`);
    return res.status(500).json({ error: { code: 500, message: "Error fetching variable prices"}})
  }
}

async function handlePutFixedPrices(req: express.Request, res: express.Response) {
  const { base, additionalPackage } = req.body;
  console.debug({ base, additionalPackage });

  if (isNaN(base) || isNaN(additionalPackage)) {
    return res.status(400).json({ error: { code: 400, message: "Incomplete body" } });
  }

  if (base < 0 || additionalPackage < 0) {
    return res.status(400).json({ error: { code: 400, message: "Prices must not be negative"}});
  }

  const data = await updateFixedPrices({ base, additionalPackage });
  console.debug({ data });

  if (data) {
    return res.status(200).json({ data });
  }

  return res.status(500).json({ code: 500, message: "Error updating fixed prices" });
}

async function handlePutVariablePrices(req: express.Request, res: express.Response) {
  const newPrices: VariablePrices[] = req.body;

  console.debug({ newPrices });

  if (!newPrices.length) {
    return res.status(400).json({ error: { code: 400, message: "Missing params" } });
  }

  try {
    for (const vp of newPrices) {
      const paramCheck = !isNaN(vp.start) && !isNaN(vp.end) && !isNaN(vp.cost);

      if (!paramCheck) {
        return res.status(400).json({ error: { code: 400, message: "Invalid params" } });
      }
    }
  } catch (e) {
    console.error(`>>>>>> ERROR: ${(e as Error).message}`);
    return res.status(500).json({ error: { code: 500, message: "Internal server error" } });
  }

  const sortedData = [...newPrices].sort((a, b) => a.start - b.start);

  if (!isExhaustive(sortedData)) {
    return res.status(400).json({ error: { code: 400, message: "Input not exhaustive" } });
  }

  if (!isContiguous(sortedData)) {
    return res.status(400).json({ error: { code: 400, message: "Input not contiguous" } });
  }

  const data = await updateVariablePrices(sortedData);
  if (data) {
    return res.status(200).json({ data });
  }

  return res.status(500).json({ code: 500, message: "Error updating variable prices"})
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

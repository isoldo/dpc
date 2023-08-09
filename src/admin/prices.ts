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

/**
 * @swagger
 * /api/admin/prices/fixed:
 *   get:
 *     summary: Get fixed prices for delivery.
 *     description: Retrieve the current fixed prices for delivery.
 *     security:
 *       - JwtAuth: []
 *     responses:
 *       200:
 *         description: OK. Fixed prices retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 base: 7
 *                 additionalPackage: 2.5
 *       404:
 *         description: Not Found. Fixed prices not found.
 *       500:
 *         description: Internal server error. Error fetching fixed prices from the database.
 */
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

/**
 * @swagger
 * /api/admin/prices/variable:
 *   get:
 *     summary: Get variable prices for delivery.
 *     description: Retrieve the current variable prices for delivery.
 *     security:
 *       - JwtAuth: []
 *     responses:
 *       200:
 *         description: OK. Variable prices retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - start: 0
 *                   end: 5
 *                   cost: 10
 *                 - start: 5
 *                   end: -1
 *                   cost: 15
 *       404:
 *         description: Not Found. Variable prices not found.
 *       500:
 *         description: Internal server error. Error fetching variable prices from the database.
 */
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
/**
 * @swagger
 * /api/admin/prices/fixed:
*   put:
*     summary: Update fixed prices for delivery.
*     description: Update the fixed prices for delivery.
*     security:
*       - JwtAuth: []
*     requestBody:
*       description: New fixed prices to update.
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               base:
*                 type: number
*                 description: Base price for delivery.
*               additionalPackage:
*                 type: number
*                 description: Additional package price for delivery.
*             required:
*               - base
*               - additionalPackage
*     responses:
*       200:
*         description: OK. Fixed prices updated successfully.
*         content:
*           application/json:
*             example:
*               data:
*                 base: 7
*                 additionalPackage: 2.5
*       400:
*         description: Bad Request. Incomplete or invalid request body.
*       401:
*         description: Unauthorized. Authentication token is missing or invalid.
*       500:
*         description: Internal Server Error. An error occurred while updating fixed prices.
*/
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

/**
 * @swagger
 * /api/admin/prices/variable:
 *   put:
 *     summary: Update variable prices for delivery.
 *     description: Update the variable prices for delivery intervals.
 *     security:
 *       - JwtAuth: []
 *     requestBody:
 *       description: New variable prices to update.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 start:
 *                   type: number
 *                   description: Start of the interval.
 *                 end:
 *                   type: number
 *                   description: End of the interval (optional, use -1 for open-ended).
 *                 cost:
 *                   type: number
 *                   description: Cost for the interval.
 *               required:
 *                 - start
 *                 - cost
  *     responses:
 *       200:
 *         description: OK. Variable prices updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - start: 0
 *                   end: 5
 *                   cost: 10
 *                 - start: 5
 *                   end: -1
 *                   cost: 15
 *       400:
 *         description: Bad Request. Incomplete or invalid request body.
 *       401:
 *         description: Unauthorized. Authentication token is missing or invalid.
 *       500:
 *         description: Internal Server Error. An error occurred while updating variable prices.
 */
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

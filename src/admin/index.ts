import express from "express";
import { isAuthorized } from "../auth.js";
import { handlePrices } from "./prices.js";
import { errorFactory } from "../utils/errorFactory.js";

export async function adminHandler(req: express.Request, res: express.Response, field: string, id?: string) {
  const authorized = await isAuthorized(req);

  if (authorized) {
    try {
      adminAuthorizedHandler(req, res, field, id);
    } catch (e) {
      const err =  e as Error;
      console.error(`>>>>>> ERROR: ${err.message}`);
      return errorFactory(res, 500, err.message);
    }
  } else {
    return errorFactory(res, 401, "Unauthorized");
  }
}

async function adminAuthorizedHandler(req: express.Request, res: express.Response, field: string, id?: string) {
  console.debug({ adminAuthorizedHandler: { method: req.method, field, id }});

  if (field === "prices") {
    handlePrices(req, res, id);
  } else {
    return errorFactory(res, 422, `Unsupported parameter: ${field}`);
  }
}

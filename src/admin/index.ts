import express from "express";
import { isAuthorized } from "../auth.js";
import { handlePrices } from "./prices.js";

export async function adminHandler(req: express.Request, res: express.Response, field: string, id?: string) {
  const authorized = await isAuthorized(req);

  if (authorized) {
    try {
      adminAuthorizedHandler(req, res, field, id);
    } catch (e) {
      console.error(`>>>>>> ERROR: ${(e as Error).message}`);
    }
  } else {
    res.status(401).json({ error: { code: 401, message: "Unauthorized"}});
  }
}

async function adminAuthorizedHandler(req: express.Request, res: express.Response, field: string, id?: string) {
  console.debug({ adminAuthorizedHandler: { method: req.method, field, id }});

  if (field === "prices") {
    handlePrices(req, res, id);
  } else {
    res.status(422).json({ message: `Unsupported parameter: ${field}`, code: 422 });
  }
}

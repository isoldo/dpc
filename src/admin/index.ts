import express from "express";
import { isAuthorized } from "../auth.js";
import { handlePrices } from "./prices.js";
import { errorFactory } from "../utils/errorFactory.js";
import crypto from "crypto";
import { isAdmin } from "../db/index.js";
import jwt from "jsonwebtoken";
import 'dotenv/config';

export async function adminHandler(req: express.Request, res: express.Response, field: string, id?: string) {
  if (field === "login") {
    return handleAdminLogin(req, res);
  }

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

async function handleAdminLogin(req: express.Request, res: express.Response) {
  const { un, pw } = req.body;

  if (!un || !pw) {
    return errorFactory(res, 400, "Missing parameters");
  }

  const pwHash = crypto.createHash("sha256").update(pw, 'ascii').digest().toString("hex");

  const adminFound = await isAdmin(un, pwHash);

  if (adminFound) {
    try {
      const secretKey = process.env.SECRET_KEY as string;
      const token = jwt.sign({ isAdmin: true }, secretKey );
      console.debug({ token });
      return res.status(200).json({ token });
    } catch (e) {
      return errorFactory(res, 500, "Missing secret key");
    }
  }

  return errorFactory(res, 401, "Unauthorized");
}

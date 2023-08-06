import express from "express";
import 'dotenv/config';
import jwt from "jsonwebtoken";


export async function isAuthorized(req: express.Request): Promise<boolean> {
  const token = req.headers.authorization;
  const secretKey = process.env.SECRET_KEY as string;

  if (!token) {
    return false;
  }

  try {
    const payload = jwt.verify(token, secretKey) as jwt.JwtPayload;

    console.debug({ payload });

    return payload.isAdmin;
  } catch (e) {
    const err = e as Error;
    console.error(`>>>>>> ERROR: ${err.message}`);
    return false;
  }
}

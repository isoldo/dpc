import express from "express";

export function errorFactory(res: express.Response, code: number, message: string) {
  return res.status(code).json({ code, message });
}

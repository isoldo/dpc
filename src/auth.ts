import express from "express";

export async function isAuthorized(req: express.Request): Promise<boolean> {
  // TODO: implement JWT authentication
  console.warn(">>> WARNING: isAuthorized is not yet implemented");
  return true;
}

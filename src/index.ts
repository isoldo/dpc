import express from "express";
import 'dotenv/config';
import { adminHandler } from "./admin/index.js";
import { deliveryHandler } from "./delivery/index.js";

const app = express();
const port = process.env.PORT || 3000;
const appName = process.env.APP_NAME || "Default delivery price calculator app name";

app.use(express.json());

app.all('/api/health', (_req, res) => {
  res.status(200).json({ status: "ALIVE" });
})

app.all('/api/admin/:field/:id?', (req, res) => {
  const field = req.params.field;
  const id = req.params.id;
  adminHandler(req, res, field, id);
});

app.post('/api/request-delivery', (req, res) => {
  deliveryHandler(req, res);
});

const listener = app.listen(port, () => {
  console.info(`${appName} listening on port ${port}`);
});

export { listener };

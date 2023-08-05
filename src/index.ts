import express from "express";
import 'dotenv/config';
import { adminHandler } from "./admin/index.js";

const app = express();
const port = process.env.PORT || 3000;
const appName = process.env.APP_NAME || "Default delivery price calculator app name";

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).send('ALIVE');
})

app.all('/api/admin/:field/:id?', (req, res) => {
  const field = req.params.field;
  const id = req.params.id;
  adminHandler(req, res, field, id);
});

app.listen(port, () => {
  console.info(`${appName} listening on port ${port}`);
})

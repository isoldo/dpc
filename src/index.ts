import express from "express";
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;
const appName = process.env.APP_NAME || "Default delivery price calculator app name";

app.get('/api/health', (_req, res) => {
  res.status(200).send('ALIVE');
})

app.listen(port, () => {
  console.info(`${appName} listening on port ${port}`);
})

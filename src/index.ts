import express from "express";

const app = express();
const port = 3000;
const appName = "(isoldo) Delivery Price Calculator";

app.get('/api/health', (_req, res) => {
  res.status(200).send('ALIVE');
})

app.listen(port, () => {
  console.info(`${appName} listening on port ${port}`);
})

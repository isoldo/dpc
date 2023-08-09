import express from "express";
import 'dotenv/config';
import { adminHandler } from "./admin/index.js";
import { deliveryHandler } from "./delivery/index.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express"

const app = express();
const port = process.env.PORT || 3000;
const appName = process.env.APP_NAME || "Default delivery price calculator app name";

app.use(express.json());

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check the health status of the application.
 *     description: Returns a JSON object indicating the health status of the application.
 *     responses:
 *       200:
 *         description: OK. The application is alive.
 *         content:
 *           application/json:
 *             example:
 *               status: ALIVE
 */
app.all('/api/health', (_req, res) => {
  res.status(200).json({ status: "ALIVE" });
})

app.all('/api/admin/:field/:id?', (req, res) => {
  const field = req.params.field;
  const id = req.params.id;
  adminHandler(req, res, field, id);
});

app.all('/api/request-delivery', (req, res) => {
  deliveryHandler(req, res);
});

const listener = app.listen(port, () => {
  console.info(`${appName} listening on port ${port}`);
});

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for Delivery Price Calculator',
    version: '1.0.0',
  },
  components: {
    securitySchemes: {
      JwtAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Development server',
    }
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./dist/src/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export { listener };

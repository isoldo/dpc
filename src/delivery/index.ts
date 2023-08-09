import express from "express";
import { createDelivery, createUser, fetchFixedPrices, fetchUserByMail, fetchVariablePrices } from "../db/index.js";
import { errorFactory } from "../utils/errorFactory.js";
import { calculateDeliveryPrice } from "./calculator.js";
import { DeliveryMailParameters, sendDeliveryMail } from "../email/index.js";

export interface DeliveryParameters {
  packageCount: number;
  distance: number;
  date: Date;
  userId: string;
  cost: number;
  baseCost: number;
  additionalPackageCost: number;
  distanceCost: number;
}

/**
 * @swagger
 * /api/request-delivery:
 *   post:
 *     summary: Request a delivery.
 *     description: Request a delivery with specified package count, distance, and user details.
 *     requestBody:
 *       description: Details for the delivery request.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageCount:
 *                 type: number
 *                 description: Number of packages for the delivery.
 *               distance:
 *                 type: number
 *                 description: Distance for the delivery in kilometers.
 *               email:
 *                 type: string
 *                 description: Email of the user requesting the delivery.
 *               phone:
 *                 type: string
 *                 description: Phone number of the user.
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Delivery date and time.
 *               name:
 *                 type: string
 *                 description: First name of the user.
 *               lastName:
 *                 type: string
 *                 description: Last name of the user.
 *             required:
 *               - packageCount
 *               - distance
 *               - email
 *               - phone
 *               - date
 *               - name
 *               - lastName
 *     responses:
 *       200:
 *         description: OK. Delivery requested successfully.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 distance: 10
 *                 packageCount: 2
 *                 date: "2023-08-09T12:00:00Z"
 *                 userId: "4e4464f5-ec61-4d1e-a7c5-67662e18a53f"
 *                 cost: 20
 *                 baseCost: 15
 *                 additionalPackageCost: 5
 *                 distanceCost: 5
 *       400:
 *         description: Bad Request. Missing or invalid request parameters.
 *       500:
 *         description: Internal Server Error. An error occurred while processing the request.
 */
export async function deliveryHandler(req: express.Request, res: express.Response) {
  if (req.method !== "POST") {
    return errorFactory(res, 405, `Method ${req.method} not supported`)
  }
  const { packageCount, distance, email, phone, date, name, lastName } = req.body;

  if (!name || !lastName || !date || !phone || !email || (packageCount === undefined) || (distance === undefined)) {
    return errorFactory(res, 400, "Missing parameters");
  }

  if (packageCount < 1) {
    return errorFactory(res, 400, "Invalid package count");
  }

  if (distance < 1) {
    return errorFactory(res, 400, "Invalid distance");
  }

  let user = await fetchUserByMail(email);
  if (!user) {
    console.debug({ newUser: { email, phone, name, lastName }});
    user = await createUser(email, phone, name, lastName);
    if (!user) {
      return errorFactory(res, 500, "Error creating a user in DB");
    }
  }

  const calculatedPrice = await calculateDeliveryPrice(res, distance, packageCount);
  if (!calculatedPrice) {
    return;
  }

  const data: DeliveryParameters = {
    distance,
    packageCount,
    date: new Date(date),
    userId: user.id,
    cost: calculatedPrice.price,
    baseCost: calculatedPrice.base,
    additionalPackageCost: calculatedPrice.additionalPackages,
    distanceCost: calculatedPrice.distance
  };

  console.debug({ deliveryParameters: data });

  const createdDelivery = await createDelivery(data);

  const emailParams: DeliveryMailParameters = {
    email: user.email,
    user: {
      name: user.name,
      lastName: user.lastName
    },
    delivery: {
      price: createdDelivery.cost,
      packageCount: createdDelivery.packageCount,
      date: new Date(createdDelivery.date),
      distance
    }
  }

  let mailStatus: string;
  if (process.env.SENDER_MAIL) {
    await sendDeliveryMail(emailParams);
    mailStatus = "sent";
  } else {
    console.warn("Email provider not configured, skipping mail send")
    mailStatus = "not sent";
  }

  return res.status(200).json({ data: createdDelivery, mailStatus });
}

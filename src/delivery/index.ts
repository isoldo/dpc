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

export async function deliveryHandler(req: express.Request, res: express.Response) {
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

  return res.status(200).json({ data, mailStatus });
}

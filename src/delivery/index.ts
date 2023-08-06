import express from "express";
import { createDelivery, createUser, fetchFixedPrices, fetchUserByMail, fetchVariablePrices } from "../db/index.js";
import { errorFactory } from "../utils/errorFactory.js";
import { calculateDeliveryPrice } from "./calculator.js";

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

  let user = await fetchUserByMail(email);
  if (!user) {
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

  await createDelivery(data);

  return res.status(200).json({ data });
}

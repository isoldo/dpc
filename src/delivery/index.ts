import express from "express";
import { createDelivery, createUser, fetchFixedPrices, fetchUserByMail, fetchVariablePrices } from "../db/index.js";
import { errorFactory } from "../utils/errorFactory.js";

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
  const fixedPrices = await fetchFixedPrices();
  if (!fixedPrices) {
    return errorFactory(res, 500, "Fixed prices not defined");
  }
  const variablePrices = await fetchVariablePrices();
  if (!variablePrices) {
    return errorFactory(res, 500, "Variable prices not defined");
  }

  const baseCost = fixedPrices.base;
  const additionalPackageCost = (packageCount - 1) * fixedPrices.additionalPackage;
  let distanceCost = 0;

  for (const vp of variablePrices) {
    console.debug({ vp });
    if (vp.start < distance) {
      console.debug(`Distance greater than start of interval (${vp.start})`);
      if (vp.end === -1 || vp.end > distance) {
        console.debug(`Distance fits in the interval [${vp.start}, ${vp.end}]`);
        console.debug(`Cost += ${(distance-vp.start) * vp.cost}`);
        distanceCost += (distance - vp.start) * vp.cost;
      } else {
        console.debug(`Distance exceeds the interval [${vp.start}, ${vp.end}]`);
        console.debug(`Cost += ${(vp.end-vp.start)*vp.cost}`);
        distanceCost += (vp.end - vp.start) * vp.cost;
      }
    }
  }

  const data: DeliveryParameters = {
    distance,
    packageCount,
    date: new Date(date),
    userId: user.id,
    cost: baseCost + additionalPackageCost + distanceCost,
    baseCost,
    additionalPackageCost,
    distanceCost
  };

  console.debug({ deliveryParameters: data });

  await createDelivery(data);

  return res.status(200).json({ data });
}

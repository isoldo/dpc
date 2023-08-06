import express from "express";
import { createUser, fetchFixedPrices, fetchUserByMail, fetchVariablePrices } from "../db/index.js";
import { errorFactory } from "../utils/errorFactory.js";

interface DeliveryParameters {
  packageCount: number;
  distance: number;
  email: string;
  phone: string;
  date: Date;
  name: string;
  lastName: string;
}

export async function deliveryHandler(req: express.Request, res: express.Response) {
  const { packageCount, distance, email, phone, date, name, lastName } = req.body;
  const data: DeliveryParameters = {
    distance,
    packageCount,
    email,
    phone,
    date,
    name,
    lastName
  };

  console.debug({ deliveryParameters: data });

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

  let cost = fixedPrices.base + (packageCount - 1) * fixedPrices.additionalPackage;

  for (const vp of variablePrices) {
    console.debug({ vp });
    if (vp.start < distance) {
      console.debug(`Distance greater than start of interval (${vp.start})`);
      if (vp.end === -1 || vp.end > distance) {
        console.debug(`Distance fits in the interval [${vp.start}, ${vp.end}]`);
        console.debug(`Cost += ${(distance-vp.start) * vp.cost}`);
        cost += (distance - vp.start) * vp.cost;
      } else {
        console.debug(`Distance exceeds the interval [${vp.start}, ${vp.end}]`);
        console.debug(`Cost += ${(vp.end-vp.start)*vp.cost}`);
        cost += (vp.end - vp.start) * vp.cost;
      }
    }
  }

  return res.status(200).json({ data: cost });
}

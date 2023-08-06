import express from "express";
import { fetchFixedPrices, fetchVariablePrices } from "../db/index.js";
import { errorFactory } from "../utils/errorFactory.js";
import { FixedPrices, VariablePrices } from "@prisma/client";

export interface CalculatedPrice {
  price: number;
  base: number;
  additionalPackages: number;
  distance: number;
}

export async function calculateDeliveryPrice(res: express.Response,
  distance: number,
  packageCount: number): Promise<CalculatedPrice | null>
{
  const fixedPrices = await fetchFixedPrices();
  if (!fixedPrices) {
    errorFactory(res, 500, "Fixed prices not defined");
    return null;
  }
  const variablePrices = await fetchVariablePrices();
  if (!variablePrices) {
    errorFactory(res, 500, "Variable prices not defined");
    return null;
  }

  const fixedCosts = calculateFixedCosts(packageCount, fixedPrices);
  const distanceCost = calculateDistanceCost(distance, variablePrices);

  const { total, ...fixedCostsBreakdown } = fixedCosts;

  const calculatedPrice: CalculatedPrice = {
    ...fixedCostsBreakdown,
    distance: distanceCost,
    price: fixedCosts.total + distanceCost
  };

  console.debug({ calculatedPrice });

  return calculatedPrice;
}

export interface CalculatedFixedCosts {
  base: number;
  additionalPackages: number;
  total: number;
}

export function calculateFixedCosts(packageCount: number, prices: FixedPrices): CalculatedFixedCosts {
  const base = prices.base;
  const additionalPackages = (packageCount - 1) * prices.additionalPackage;
  const total = base + additionalPackages;
  return { base, additionalPackages, total };
}

export function calculateDistanceCost(distance: number, intervals: VariablePrices[]): number {
  let distanceCost = 0;
  for (const interval of intervals) {
    console.debug({ interval });

    if (interval.start < distance) {
      console.debug(`Distance falls into the interval: [${interval.start}, ${interval.end}>`);
      if (interval.end === -1 || interval.end > distance) {
        console.debug(`Distance ends in the interval: [${interval.start}, ${interval.end}>`);
        distanceCost += interval.cost * (distance - interval.start);
      } else {
        console.debug(`Distance exceeds the interval: [${interval.start}, ${interval.end}>`);
        distanceCost += interval.cost * (interval.end - interval.start);
      }
    } else {
      console.debug(`Distance does not fit in the interval [${interval.start}, ${interval.end}>`);
    }
  }

  return distanceCost;
}

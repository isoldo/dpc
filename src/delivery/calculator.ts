import express from "express";
import { fetchFixedPrices, fetchVariablePrices } from "../db/index.js";
import { errorFactory } from "../utils/errorFactory.js";
import { FixedPrices, VariablePrices } from "@prisma/client";

export interface CalculatedPrice {
  price: number;
  base: number;
  additionalPackages: number;
  distance: number;
  weekendTariff: boolean;
}

export async function calculateDeliveryPrice(res: express.Response,
  distance: number,
  packageCount: number,
  date: Date): Promise<CalculatedPrice | null>
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
  const applyWeekendTariff = isWeekend(date);

  const calculatedPrice: CalculatedPrice = {
    ...fixedCostsBreakdown,
    distance: distanceCost,
    // task specifies a hardcoded 10% increase
    price: Number(((fixedCosts.total + distanceCost) * (applyWeekendTariff ? 1.1 : 1)).toFixed(2)),
    weekendTariff: applyWeekendTariff
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

export function isWeekend(date: Date): boolean {
  console.log( { isw: date });
  // 0 is Sunday, 6 is Saturday
  const weekend = [0, 6];
  return weekend.includes(date.getDay());
}

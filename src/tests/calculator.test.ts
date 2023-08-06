import {describe, expect, test} from '@jest/globals';
import { FixedPrices, VariablePrices } from '@prisma/client';
import { calculateDistanceCost, calculateFixedCosts } from '../delivery/calculator.js';

const fixedPrices: FixedPrices = {
  id: 42,
  active: true,
  base: 1,
  additionalPackage: 0.5
};

const intervals: VariablePrices[] = [
  { start: 0, end: 5, cost: 2 },
  { start: 5, end: 10, cost: 1.5 },
  { start: 10, end: 20, cost: 1.3 },
  { start: 20, end: -1, cost: 1 }
];

describe("Test calculator of package count related cost",
  () => {
    test("A single package",
      () => {
        expect(calculateFixedCosts(1, fixedPrices)).toEqual(
          {
            base: fixedPrices.base,
            additionalPackages: 0,
            total: fixedPrices.base
          }
        );
      }
    );
    test("Two packages",
      () => {
        expect(calculateFixedCosts(2, fixedPrices)).toEqual(
          {
            base: fixedPrices.base,
            additionalPackages: (2-1) * fixedPrices.additionalPackage,
            total: fixedPrices.base + fixedPrices.additionalPackage
          }
        );
      }
    );
    test("Ten packages",
      () => {
        expect(calculateFixedCosts(10, fixedPrices)).toEqual(
          {
            base: fixedPrices.base,
            additionalPackages: (10-1) * fixedPrices.additionalPackage,
            total: fixedPrices.base + (10-1) * fixedPrices.additionalPackage
          }
        );
      }
    );
  }
);

describe("Test calculator of distance-related cost",
  () => {
    test("Distance is negative",
      () => {
        const distance = -1;
        expect(calculateDistanceCost(distance, intervals)).toEqual(0);
      }
    );
    test("Distance falls inside the first interval",
      () => {
        const distance = 3;
        expect(calculateDistanceCost(distance, intervals)).toEqual(3 * intervals[0].cost);
      }
    );
    test("Distance falls inside the second interval",
      () => {
        const distance = 6;
        expect(calculateDistanceCost(distance, intervals)).toEqual(
          (intervals[0].end - intervals[0].start) * intervals[0].cost +
          (distance - intervals[1].start) * intervals[1].cost
        );
      }
    );
    test("Distance falls inside the third interval",
      () => {
        const distance = 12;
        expect(calculateDistanceCost(distance, intervals)).toEqual(
          (intervals[0].end - intervals[0].start) * intervals[0].cost +
          (intervals[1].end - intervals[1].start) * intervals[1].cost +
          (distance - intervals[2].start) * intervals[2].cost
        );
      }
    );
    test("Distance falls inside the last interval",
      () => {
        const distance = 500;
        expect(calculateDistanceCost(distance, intervals)).toEqual(
          (intervals[0].end - intervals[0].start) * intervals[0].cost +
          (intervals[1].end - intervals[1].start) * intervals[1].cost +
          (intervals[2].end - intervals[2].start) * intervals[2].cost +
          (distance - intervals[3].start) * intervals[3].cost
        );
      }
    );
    test("Distance is on the interval border",
      () => {
        const distance = 10;
        expect(calculateDistanceCost(distance, intervals)).toEqual(
          (intervals[0].end - intervals[0].start) * intervals[0].cost +
          (intervals[1].end - intervals[1].start) * intervals[1].cost
        );
      }
    );
  }
)

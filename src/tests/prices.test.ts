import {describe, expect, test} from '@jest/globals';

import { VariablePrices } from "@prisma/client"
import { isContiguous, isExhaustive } from '../admin/prices.js';

const singleEntryNonExhaustive: VariablePrices[] = [ { start: 10, end: 20, cost: 1 }];
const singleEntryExhaustive: VariablePrices[] = [ { start: 0, end: -1, cost: 1 }];
const multipleSortedContiguousNonExhaustive: VariablePrices[] = [
  { start: 5, end: 10, cost: 1 },
  { start: 10, end: 15, cost: 1 },
  { start: 15, end: 23, cost: 1 }
];
const multipleSortedContiguousExhaustive: VariablePrices[] = [
  { start: 0, end: 10, cost: 1 },
  { start: 10, end: 15, cost: 1 },
  { start: 15, end: -1, cost: 1 }
];
const multipleUnsortedContiguousNonExhaustive: VariablePrices[] = [
  { start: 5, end: 10, cost: 1 },
  { start: 15, end: 23, cost: 1 },
  { start: 10, end: 15, cost: 1 }
];
const multipleUnsortedContiguousExhaustive: VariablePrices[] = [
  { start: 0, end: 10, cost: 1 },
  { start: 15, end: -1, cost: 1 },
  { start: 10, end: 15, cost: 1 }
];
const multipleSortedNonContiguousNonExhaustive: VariablePrices[] = [
  { start: 5, end: 10, cost: 1 },
  { start: 10, end: 15, cost: 1 },
  { start: 16, end: 23, cost: 1 }
];
const multipleSortedNonContiguousExhaustive: VariablePrices[] = [
  { start: 0, end: 10, cost: 1 },
  { start: 10, end: 15, cost: 1 },
  { start: 16, end: -1, cost: 1 }
];

describe("Check if intervals are contiguous",
  () => {
    test("Check a single interval, non-exhaustive",
      () => {
        expect(isContiguous(singleEntryNonExhaustive)).toBeTruthy();
      }
    );
    test("Check multiple intervals, sorted, contiguous, non-exhaustive",
      () => {
        expect(isContiguous(multipleSortedContiguousNonExhaustive)).toBeTruthy();
      }
    );
    test("Check multiple intervals, sorted, contiguous, exhaustive",
      () => {
        expect(isContiguous(multipleSortedContiguousExhaustive)).toBeTruthy();
      }
    );
    test("Check multiple intervals, unsorted, contiguous, non-exhaustive",
      () => {
        expect(isContiguous(multipleUnsortedContiguousNonExhaustive)).toBeFalsy();
      }
    );
    test("Check multiple intervals, unsorted, contiguous, exhaustive",
      () => {
        expect(isContiguous(multipleUnsortedContiguousExhaustive)).toBeFalsy();
      }
    );
    test("Check multiple intervals, sorted, non-contiguous, non-exhaustive",
      () => {
        expect(isContiguous(multipleSortedNonContiguousNonExhaustive)).toBeFalsy();
      }
    );
    test("Check multiple intervals, sorted, non-contiguous, exhaustive",
      () => {
        expect(isContiguous(multipleSortedNonContiguousExhaustive)).toBeFalsy();
      }
    );
  }
)

describe("Check if intervals are exhaustive",
  () => {
    test("Check a single non-exhaustive interval",
      () => {
        expect(isExhaustive(singleEntryNonExhaustive)).toBeFalsy();
      }
    );
    test("Check a single exhaustive interval",
      () => {
        expect(isExhaustive(singleEntryExhaustive)).toBeTruthy();
      }
    );
    test("Check multiple intervals, sorted, contiguous, non-exhaustive",
      () => {
        expect(isExhaustive(multipleSortedContiguousNonExhaustive)).toBeFalsy();
      }
    );
    test("Check multiple intervals, sorted, contiguous, exhaustive",
      () => {
        expect(isExhaustive(multipleSortedContiguousExhaustive)).toBeTruthy();
      }
    );
    test("Check multiple intervals, unsorted, contiguous, non-exhaustive",
      () => {
        expect(isExhaustive(multipleUnsortedContiguousNonExhaustive)).toBeFalsy();
      }
    );
    test("Check multiple intervals, unsorted, contiguous, exhaustive",
      () => {
        expect(isExhaustive(multipleUnsortedContiguousExhaustive)).toBeFalsy();
      }
    );
    test("Check multiple intervals, sorted, non-contiguous, non-exhaustive",
      () => {
        expect(isExhaustive(multipleSortedNonContiguousNonExhaustive)).toBeFalsy();
      }
    );
    test("Check multiple intervals, sorted, non-contiguous, exhaustive",
      () => {
        expect(isExhaustive(multipleSortedNonContiguousExhaustive)).toBeTruthy();
      }
    );
  }
)

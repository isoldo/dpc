import { isWeekend } from "../delivery/calculator.js";

describe("Check that weekend detector works", () =>
  {
    const mon = new Date(1691388000000);
    const tue = new Date(1691474400000);
    const wen = new Date(1691560800000);
    const thu = new Date(1691647200000);
    const fri = new Date(1691733600000);
    const sat = new Date(1691820000000);
    const sun = new Date(1691906400000);
    it("should return false for workdays", () =>
      {
        expect(isWeekend(mon)).toBeFalsy();
        expect(isWeekend(tue)).toBeFalsy();
        expect(isWeekend(wen)).toBeFalsy();
        expect(isWeekend(thu)).toBeFalsy();
        expect(isWeekend(fri)).toBeFalsy();
      }
    );
    it("should return true for weekends", () =>
      {
        expect(isWeekend(sat)).toBeTruthy();
        expect(isWeekend(sun)).toBeTruthy();
      }
    );
  }
);

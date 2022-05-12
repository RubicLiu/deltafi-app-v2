import { stringCutDecimals } from "../../src/utils/tokenUtils";

describe("utils/tokenUtils", function () {
  it("stringCutDecimals", function () {
    expect(stringCutDecimals(20, "2.2222222222222222222233333")).toEqual("2.22222222222222222222");
    expect(stringCutDecimals(8, "2.2222222")).toEqual("2.2222222");
    expect(stringCutDecimals(7, "2.2222222")).toEqual("2.2222222");
    expect(stringCutDecimals(7, "2.2222220")).toEqual("2.222222");
    expect(stringCutDecimals(6, "2.2222222")).toEqual("2.222222");
    expect(stringCutDecimals(6, "2.2222220")).toEqual("2.222222");
    expect(stringCutDecimals(6, "2.2222200")).toEqual("2.22222");
    expect(stringCutDecimals(5, "2.2222220")).toEqual("2.22222");
    expect(stringCutDecimals(4, "2.2222220")).toEqual("2.2222");
    expect(stringCutDecimals(4, "2.0000")).toEqual("2");
    expect(stringCutDecimals(4, "2.000001")).toEqual("2");
    expect(stringCutDecimals(4, "222222222222222222222222222222.000001")).toEqual(
      "222222222222222222222222222222",
    );
    expect(stringCutDecimals(5, "2.000001")).toEqual("2");
    expect(stringCutDecimals(6, "2.000001")).toEqual("2.000001");
    expect(stringCutDecimals(10, "2.000001")).toEqual("2.000001");
    expect(stringCutDecimals(10, "2")).toEqual("2");

    expect(() => stringCutDecimals(5, "223.3.3")).toThrow("Invalid amount");
    expect(() => stringCutDecimals(-1, "223.333")).toThrow("Invalid decimals");
    expect(() => stringCutDecimals(3.3, "223.333")).toThrow("Invalid decimals");
    expect(() => stringCutDecimals(NaN, "223.333")).toThrow("Invalid decimals");
  });
});

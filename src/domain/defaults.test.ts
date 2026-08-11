import { describe, expect, it } from "vitest";
import { HARDWARE_CLASS_IDS, createDefaultPassport } from "./defaults";

describe("safe Passport defaults", () => {
  it("creates independent mutable branches for every Passport", () => {
    const first = createDefaultPassport();
    const second = createDefaultPassport();
    first.answers.gameLaunchers.push("riot");
    first.liveTests.wifi = "works";
    first.dataMigration.documents = {
      importance: "essential",
      method: "copy",
      notes: ""
    };
    expect(second.answers.gameLaunchers).toEqual(["steam"]);
    expect(second.liveTests.wifi).toBe("not_tested");
    expect(second.dataMigration).toEqual({});
  });

  it("initializes every hardware class as UNKNOWN", () => {
    const passport = createDefaultPassport();
    expect(Object.keys(passport.hardware.evidence).sort()).toEqual([...HARDWARE_CLASS_IDS].sort());
    expect(Object.values(passport.hardware.evidence).every((item) => item.state === "unknown")).toBe(true);
  });

  it("requires graphics by default without marking it compatible", () => {
    const passport = createDefaultPassport();
    expect(passport.hardware.evidence.graphics).toMatchObject({
      state: "unknown",
      required: true
    });
    expect(Object.entries(passport.hardware.evidence).filter(([, item]) => item.required)).toHaveLength(1);
  });
});

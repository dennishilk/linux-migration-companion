import { beforeEach, describe, expect, it } from "vitest";
import { makePassport } from "../test/fixtures";
import { clearPassport, loadPassport, savePassport } from "./storage";

const V2 = "linux-migration-companion:passport:v2";
const V1 = "linux-migration-companion:passport:v1";

function legacyPassport() {
  const current = makePassport();
  return {
    schemaVersion: 1,
    product: current.product,
    locale: current.locale,
    updatedAt: current.updatedAt,
    answers: current.answers,
    softwareSelections: {},
    hardware: {
      source: "manual",
      gpuVendor: "unknown",
      overall: "unknown",
      scannerStatus: "deferred",
      notes: ""
    },
    liveTests: current.liveTests,
    mediaProgress: current.mediaProgress,
    selectedDistroId: null
  };
}

describe("Passport local persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("loads a valid schema-v2 Passport", () => {
    const passport = makePassport();
    window.localStorage.setItem(V2, JSON.stringify(passport));
    expect(loadPassport()).toEqual(passport);
  });

  it("loads and migrates a legacy schema-v1 Passport", () => {
    window.localStorage.setItem(V1, JSON.stringify(legacyPassport()));
    expect(loadPassport()?.schemaVersion).toBe(2);
  });

  it("returns null for malformed stored data", () => {
    window.localStorage.setItem(V2, "{broken");
    expect(loadPassport()).toBeNull();
  });

  it("saves v2 and removes the legacy key", () => {
    window.localStorage.setItem(V1, JSON.stringify(legacyPassport()));
    savePassport(makePassport());
    expect(window.localStorage.getItem(V2)).not.toBeNull();
    expect(window.localStorage.getItem(V1)).toBeNull();
  });

  it("clears both current and legacy storage", () => {
    window.localStorage.setItem(V1, "legacy");
    window.localStorage.setItem(V2, "current");
    clearPassport();
    expect(window.localStorage.getItem(V1)).toBeNull();
    expect(window.localStorage.getItem(V2)).toBeNull();
  });
});

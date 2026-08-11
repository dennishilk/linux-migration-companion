import { beforeEach, describe, expect, it } from "vitest";
import { makePassport } from "../test/fixtures";
import { clearPassport, loadPassport, savePassport } from "./storage";

const V3 = "linux-migration-companion:passport:v3";
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

function versionTwoPassport() {
  const current = makePassport();
  return {
    ...current,
    schemaVersion: 2,
    hardware: {
      source: "manual",
      gpuVendor: current.hardware.gpuVendor,
      scannerStatus: "deferred",
      evidence: current.hardware.evidence,
      notes: current.hardware.notes
    }
  };
}

describe("Passport local persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("loads and migrates a valid schema-v2 Passport", () => {
    const passport = versionTwoPassport();
    window.localStorage.setItem(V2, JSON.stringify(passport));
    expect(loadPassport()).toMatchObject({ schemaVersion: 3, locale: passport.locale });
    expect(loadPassport()?.hardware.snapshot).toBeNull();
  });

  it("loads and migrates a legacy schema-v1 Passport", () => {
    window.localStorage.setItem(V1, JSON.stringify(legacyPassport()));
    expect(loadPassport()?.schemaVersion).toBe(3);
  });

  it("returns null for malformed stored data", () => {
    window.localStorage.setItem(V2, "{broken");
    expect(loadPassport()).toBeNull();
  });

  it("saves v3 and removes both legacy keys", () => {
    window.localStorage.setItem(V1, JSON.stringify(legacyPassport()));
    window.localStorage.setItem(V2, JSON.stringify(versionTwoPassport()));
    savePassport(makePassport());
    expect(window.localStorage.getItem(V3)).not.toBeNull();
    expect(window.localStorage.getItem(V1)).toBeNull();
    expect(window.localStorage.getItem(V2)).toBeNull();
  });

  it("clears all app-owned Passport versions and no foreign key", () => {
    window.localStorage.setItem(V1, "legacy");
    window.localStorage.setItem(V2, "legacy-current");
    window.localStorage.setItem(V3, "current");
    window.localStorage.setItem("another-app:data", "keep");
    clearPassport();
    expect(window.localStorage.getItem(V1)).toBeNull();
    expect(window.localStorage.getItem(V2)).toBeNull();
    expect(window.localStorage.getItem(V3)).toBeNull();
    expect(window.localStorage.getItem("another-app:data")).toBe("keep");
  });
});

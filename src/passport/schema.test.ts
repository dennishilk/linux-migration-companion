import { describe, expect, it } from "vitest";
import { makePassport } from "../test/fixtures";
import { makeWindowsSnapshot } from "../test/hardwareFixtures";
import {
  MAX_PASSPORT_BYTES,
  migrationPassportSchema,
  parsePassportText,
  serializePassport
} from "./schema";

function makeV1(overall: "verified" | "probably_supported" | "unknown" | "known_issue" | "proprietary_driver_required" = "unknown") {
  const passport = makePassport();
  return {
    schemaVersion: 1,
    product: passport.product,
    locale: passport.locale,
    updatedAt: passport.updatedAt,
    answers: passport.answers,
    softwareSelections: passport.softwareSelections,
    hardware: {
      source: "manual",
      gpuVendor: passport.hardware.gpuVendor,
      overall,
      scannerStatus: "deferred",
      notes: "Imported legacy note"
    },
    liveTests: passport.liveTests,
    mediaProgress: passport.mediaProgress,
    selectedDistroId: "linux-mint-cinnamon"
  };
}

function makeV2() {
  const passport = makePassport();
  return {
    ...passport,
    schemaVersion: 2,
    hardware: {
      source: "manual",
      gpuVendor: passport.hardware.gpuVendor,
      scannerStatus: "deferred",
      evidence: passport.hardware.evidence,
      notes: passport.hardware.notes
    }
  };
}

describe("Migration Passport schema", () => {
  it("round-trips a valid version 3 Passport", () => {
    const passport = makePassport();
    passport.selectedDistroId = "linux-mint-cinnamon";
    passport.softwareSelections.firefox = "essential";
    expect(parsePassportText(serializePassport(passport))).toEqual(passport);
  });

  it("preserves every public 0.3.0 system-interest answer after the wording change", () => {
    const values = [
      "use_it",
      "customize",
      "declarative",
      "manual_build",
      "compile_control"
    ] as const;
    for (const systemInterest of values) {
      const passport = makePassport();
      passport.answers.systemInterest = systemInterest;
      expect(parsePassportText(serializePassport(passport)).answers.systemInterest).toBe(systemInterest);
    }
  });

  it("accepts every newly included profile without changing Passport v3", () => {
    for (const distroId of [
      "void-linux",
      "pop-os",
      "bazzite",
      "endeavouros",
      "kubuntu"
    ]) {
      const passport = makePassport();
      passport.selectedDistroId = distroId;
      passport.comparisonDistroIds = [distroId];
      const parsed = parsePassportText(serializePassport(passport));
      expect(parsed.schemaVersion).toBe(3);
      expect(parsed.selectedDistroId).toBe(distroId);
      expect(parsed.comparisonDistroIds).toEqual([distroId]);
    }
  });

  it("rejects malformed JSON", () => {
    expect(() => parsePassportText("{not-json")).toThrow("passport_invalid_json");
  });

  it("rejects a file above 256 KiB before parsing", () => {
    expect(() => parsePassportText("x".repeat(MAX_PASSPORT_BYTES + 1))).toThrow("passport_too_large");
  });

  it("rejects excessively deep input", () => {
    let value: unknown = "leaf";
    for (let index = 0; index < 20; index += 1) value = { child: value };
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_too_deep");
  });

  it("rejects unknown top-level properties", () => {
    const value = { ...makePassport(), unexpected: true };
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("rejects nested unknown properties", () => {
    const value = makePassport() as ReturnType<typeof makePassport> & {
      hardware: ReturnType<typeof makePassport>["hardware"] & { serial?: string };
    };
    value.hardware.serial = "do-not-import";
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("rejects unknown software identifiers", () => {
    const value = makePassport();
    value.softwareSelections["prototype-pollution-or-old-id"] = "essential";
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("rejects an unknown selected distribution", () => {
    const value = makePassport();
    value.selectedDistroId = "not-a-real-profile";
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("limits private notes to 1,000 characters", () => {
    const value = makePassport();
    value.hardware.notes = "a".repeat(1001);
    expect(migrationPassportSchema.safeParse(value).success).toBe(false);
  });

  it("accepts all defined local evidence states", () => {
    const states = [
      "unknown",
      "known_fact",
      "user_reported",
      "live_verified",
      "failed_test",
      "known_issue",
      "not_applicable"
    ] as const;
    for (const state of states) {
      const value = makePassport();
      value.hardware.evidence.graphics.state = state;
      if (state === "not_applicable") {
        value.hardware.evidence.graphics.required = false;
      }
      expect(migrationPassportSchema.safeParse(value).success, state).toBe(true);
    }
  });

  it("migrates a strict Passport v1 file to schema v3", () => {
    const migrated = parsePassportText(JSON.stringify(makeV1("verified")));
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.hardware.evidence.graphics.state).toBe("known_fact");
    expect(migrated.comparisonDistroIds).toEqual(["linux-mint-cinnamon"]);
    expect(migrated.dataMigration).toEqual({});
    expect(migrated.hardware.snapshot).toBeNull();
  });

  it("migrates a strict Passport v2 without inventing snapshot evidence", () => {
    const v2 = makeV2();
    v2.hardware.evidence.wifi = {
      state: "user_reported",
      required: true,
      details: "Existing v2 report"
    };
    const migrated = parsePassportText(JSON.stringify(v2));
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.hardware.snapshot).toBeNull();
    expect(migrated.hardware.evidence.wifi).toEqual(v2.hardware.evidence.wifi);
    expect(Object.values(migrated.liveTests).every((item) => item === "not_tested")).toBe(true);
  });

  it("round-trips current snapshot provenance through Passport v3", () => {
    const passport = makePassport();
    passport.hardware.snapshot = {
      acquisition: "file_import",
      acquiredAt: "2026-08-11T12:01:00.000Z",
      snapshot: makeWindowsSnapshot()
    };
    expect(parsePassportText(serializePassport(passport))).toEqual(passport);
  });

  it("does not invent live verification while migrating v1", () => {
    const migrated = parsePassportText(JSON.stringify(makeV1("verified")));
    expect(Object.values(migrated.hardware.evidence).some((item) => item.state === "live_verified")).toBe(false);
  });

  it("preserves a legacy known issue as a known issue", () => {
    expect(parsePassportText(JSON.stringify(makeV1("known_issue"))).hardware.evidence.graphics.state).toBe("known_issue");
  });

  it("rejects stale or future schema versions", () => {
    for (const schemaVersion of [0, 4, 99]) {
      expect(() => parsePassportText(JSON.stringify({ ...makePassport(), schemaVersion }))).toThrow("passport_schema_invalid");
    }
  });

  it("rejects more than three comparison distributions", () => {
    const value = makePassport();
    value.comparisonDistroIds = ["linux-mint-cinnamon", "zorin-os", "ubuntu-lts", "fedora-kde"];
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("rejects duplicate comparison distributions", () => {
    const value = makePassport();
    value.comparisonDistroIds = ["ubuntu-lts", "ubuntu-lts"];
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("rejects unknown comparison and data-migration identifiers", () => {
    const comparison = makePassport();
    comparison.comparisonDistroIds = ["invented-distro"];
    expect(() => parsePassportText(JSON.stringify(comparison))).toThrow("passport_schema_invalid");

    const data = makePassport() as ReturnType<typeof makePassport> & { dataMigration: Record<string, unknown> };
    data.dataMigration.invented_data = { importance: "essential", method: "copy", notes: "" };
    expect(() => parsePassportText(JSON.stringify(data))).toThrow("passport_schema_invalid");
  });

  it("rejects contradictory required/not-applicable hardware", () => {
    const value = makePassport();
    value.hardware.evidence.graphics = {
      state: "not_applicable",
      required: true,
      details: "contradiction"
    };
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("rejects unknown hardware evidence fields", () => {
    const value = makePassport() as ReturnType<typeof makePassport> & {
      hardware: ReturnType<typeof makePassport>["hardware"] & {
        evidence: Record<string, unknown>;
      };
    };
    value.hardware.evidence.invented_device = {
      state: "live_verified",
      required: true,
      details: ""
    };
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("rejects duplicate launcher answers", () => {
    const value = makePassport();
    value.answers.gameLaunchers = ["steam", "steam"];
    expect(() => parsePassportText(JSON.stringify(value))).toThrow("passport_schema_invalid");
  });

  it("round-trips markup-like notes as inert data", () => {
    const value = makePassport();
    value.hardware.notes = '<img src=x onerror="alert(1)">';
    expect(parsePassportText(serializePassport(value)).hardware.notes).toBe(value.hardware.notes);
  });
});

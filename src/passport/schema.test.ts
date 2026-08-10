import { describe, expect, it } from "vitest";
import { makePassport } from "../test/fixtures";
import {
  MAX_PASSPORT_BYTES,
  migrationPassportSchema,
  parsePassportText,
  serializePassport
} from "./schema";

describe("Migration Passport schema", () => {
  it("round-trips a valid version 1 Passport", () => {
    const passport = makePassport();
    passport.selectedDistroId = "linux-mint-cinnamon";
    passport.softwareSelections.firefox = "essential";
    expect(parsePassportText(serializePassport(passport))).toEqual(passport);
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
      "verified",
      "probably_supported",
      "unknown",
      "known_issue",
      "proprietary_driver_required"
    ] as const;
    for (const state of states) {
      const value = makePassport();
      value.hardware.overall = state;
      expect(migrationPassportSchema.safeParse(value).success, state).toBe(true);
    }
  });
});

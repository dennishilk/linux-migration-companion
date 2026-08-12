import { describe, expect, it } from "vitest";
import { createDefaultHardware } from "../domain/defaults";
import type { StoredHardwareSnapshot } from "../domain/types";
import { assessSoftware } from "../engine/assess";
import { assessMigrationReadiness } from "../engine/readiness";
import { makeWindowsSnapshot } from "../test/hardwareFixtures";
import { makePassport } from "../test/fixtures";
import { applyHardwareSnapshot, factsForHardwareClass } from "./integration";

function storedSnapshot(): StoredHardwareSnapshot {
  return {
    acquisition: "file_import",
    acquiredAt: "2026-08-11T12:01:00.000Z",
    snapshot: makeWindowsSnapshot()
  };
}

describe("hardware snapshot evidence integration", () => {
  it("maps represented hardware classes to known facts only", () => {
    const hardware = applyHardwareSnapshot(createDefaultHardware(), storedSnapshot());
    expect(hardware.evidence.graphics.state).toBe("known_fact");
    expect(hardware.evidence.wifi.state).toBe("known_fact");
    expect(hardware.evidence.ethernet.state).toBe("known_fact");
    expect(hardware.evidence.fingerprint.state).toBe("known_fact");
    expect(hardware.evidence.printer.state).toBe("unknown");
    expect(hardware.evidence.wifi.required).toBe(false);
  });

  it("derives hybrid graphics from multiple detected adapters without a support claim", () => {
    const hardware = applyHardwareSnapshot(createDefaultHardware(), storedSnapshot());
    expect(hardware.evidence.hybrid_graphics.state).toBe("known_fact");
    expect(factsForHardwareClass(hardware.snapshot, "hybrid_graphics")).toHaveLength(2);
    expect(JSON.stringify(hardware)).not.toMatch(/compatible|supported/i);
  });

  it("maps multiple connected displays as a factual external-monitor prompt", () => {
    const hardware = applyHardwareSnapshot(createDefaultHardware(), storedSnapshot());
    expect(hardware.evidence.external_monitors.state).toBe("known_fact");
    expect(hardware.snapshot?.snapshot.system.connectedDisplays).toBe(2);
  });

  it("infers only a manually overridable graphics vendor, never compatibility", () => {
    const hardware = applyHardwareSnapshot(createDefaultHardware(), storedSnapshot());
    expect(hardware.gpuVendor).toBe("nvidia");
    const corrected = { ...hardware, gpuVendor: "intel" as const };
    expect(corrected.snapshot).toEqual(hardware.snapshot);
  });

  it("preserves live, failed, known-issue and manually detailed evidence", () => {
    const hardware = createDefaultHardware();
    hardware.evidence.graphics.state = "live_verified";
    hardware.evidence.wifi.state = "failed_test";
    hardware.evidence.ethernet.state = "known_issue";
    hardware.evidence.fingerprint = {
      state: "user_reported",
      required: true,
      details: "Manually checked model"
    };
    const applied = applyHardwareSnapshot(hardware, storedSnapshot());
    expect(applied.evidence.graphics.state).toBe("live_verified");
    expect(applied.evidence.wifi.state).toBe("failed_test");
    expect(applied.evidence.ethernet.state).toBe("known_issue");
    expect(applied.evidence.fingerprint).toEqual(hardware.evidence.fingerprint);
  });

  it("does not change required semantics or any live-test result", () => {
    const passport = makePassport();
    passport.hardware.evidence.wifi.required = true;
    const liveBefore = structuredClone(passport.liveTests);
    passport.hardware = applyHardwareSnapshot(passport.hardware, storedSnapshot());
    expect(passport.hardware.evidence.wifi.required).toBe(true);
    expect(passport.liveTests).toEqual(liveBefore);
    expect(Object.values(passport.liveTests).every((value) => value === "not_tested")).toBe(true);
  });

  it("keeps browser-only reports out of device evidence", () => {
    const record = storedSnapshot();
    record.acquisition = "browser_runtime";
    record.snapshot = {
      schemaVersion: 1,
      product: "linux-migration-companion-hardware-snapshot",
      createdAt: "2026-08-11T12:00:00.000Z",
      source: "browser_reported",
      collector: { id: "browser-snapshot", version: "1.0.0" },
      system: {
        osFamily: "windows",
        architecture: "unknown",
        formFactor: "unknown",
        logicalProcessors: 8,
        memoryGiB: 4,
        firmware: "unknown",
        secureBoot: "unavailable",
        virtualization: "unavailable"
      },
      browserCapabilities: {
        platform: "reported",
        hardwareConcurrency: "reported_reduced",
        deviceMemory: "reported_reduced",
        webgpu: "adapter_available"
      },
      facts: []
    };
    const hardware = applyHardwareSnapshot(createDefaultHardware(), record);
    expect(Object.values(hardware.evidence).every((item) => item.state === "unknown")).toBe(true);
  });

  it("replaces stale snapshot-derived known facts while preserving manual details", () => {
    const first = applyHardwareSnapshot(createDefaultHardware(), storedSnapshot());
    first.evidence.fingerprint.details = "Manual note keeps this factual assessment";
    const replacement = storedSnapshot();
    replacement.snapshot.facts = replacement.snapshot.facts.filter(
      (fact) => !["wifi", "fingerprint"].includes(fact.category)
    );
    const applied = applyHardwareSnapshot(first, replacement);
    expect(applied.evidence.wifi.state).toBe("unknown");
    expect(applied.evidence.fingerprint.state).toBe("known_fact");
    expect(applied.evidence.fingerprint.details).toContain("Manual note");
  });

  it("keeps readiness conservative for detected but untested required hardware", () => {
    const passport = makePassport();
    passport.softwareSelections = { firefox: "important" };
    passport.hardware = applyHardwareSnapshot(passport.hardware, storedSnapshot());
    passport.hardware.evidence.wifi.required = true;
    const result = assessMigrationReadiness(
      passport,
      assessSoftware(passport.softwareSelections)
    );
    expect(result.state).toBe("live_test_required");
    expect(result.checks.some((check) => check.en.includes("not live-test verified"))).toBe(true);
  });

  it("preserves the exact current snapshot in a Passport round trip", () => {
    const passport = makePassport();
    passport.hardware = applyHardwareSnapshot(passport.hardware, storedSnapshot());
    expect(passport.hardware.snapshot).toEqual(storedSnapshot());
  });
});

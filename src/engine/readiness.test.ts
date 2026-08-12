import { describe, expect, it } from "vitest";
import { HARDWARE_CLASS_IDS } from "../domain/defaults";
import type { MigrationPassport } from "../domain/types";
import { makePassport } from "../test/fixtures";
import { assessSoftware } from "./assess";
import { assessMigrationReadiness } from "./readiness";

function readyPassport(): MigrationPassport {
  const passport = makePassport();
  passport.answers = {
    ...passport.answers,
    gaming: "none",
    gameLaunchers: [],
    migrationMode: "replace"
  };
  passport.liveTests = Object.fromEntries(
    Object.keys(passport.liveTests).map((id) => [id, "not_applicable"])
  ) as MigrationPassport["liveTests"];
  for (const id of HARDWARE_CLASS_IDS) {
    passport.hardware.evidence[id] = {
      state: "not_applicable",
      required: false,
      details: ""
    };
  }
  passport.hardware.evidence.graphics = {
    state: "live_verified",
    required: true,
    details: "Native resolution and suspend tested"
  };
  passport.liveTests.graphics = "works";
  passport.dataMigration = {
    backups: {
      importance: "essential",
      method: "manual_check",
      notes: "Representative restore completed"
    }
  };
  return passport;
}

describe("migration readiness and Windows retention", () => {
  it("returns insufficient evidence for the untouched Passport", () => {
    const passport = makePassport();
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("insufficient_evidence");
    expect(result.strategy).toBe("test_first");
  });

  it("lets a hard software blocker outrank all positive evidence", () => {
    const passport = readyPassport();
    passport.softwareSelections = { photoshop: "essential" };
    const result = assessMigrationReadiness(
      passport,
      assessSoftware(passport.softwareSelections)
    );
    expect(result.state).toBe("blocked");
    expect(result.strategy).toBe("keep_windows_for_workflows");
    expect(result.blockers[0].en).toContain("Photoshop");
  });

  it("retains Windows temporarily for an essential high-risk workflow", () => {
    const passport = readyPassport();
    passport.softwareSelections = { "enterprise-vpn": "essential" };
    const result = assessMigrationReadiness(
      passport,
      assessSoftware(passport.softwareSelections)
    );
    expect(result.state).toBe("windows_should_be_retained");
    expect(result.strategy).toBe("keep_windows_temporarily");
  });

  it("blocks on a failed required hardware test", () => {
    const passport = readyPassport();
    passport.hardware.evidence.wifi = {
      state: "failed_test",
      required: true,
      details: "Drops after wake"
    };
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("blocked");
    expect(result.strategy).toBe("migration_blocked");
  });

  it("blocks on a known issue in required hardware", () => {
    const passport = readyPassport();
    passport.hardware.evidence.dock = {
      state: "known_issue",
      required: true,
      details: "Display output fails"
    };
    expect(assessMigrationReadiness(passport, assessSoftware({})).state).toBe("blocked");
  });

  it("does not treat a known fact as live verification", () => {
    const passport = readyPassport();
    passport.hardware.evidence.wifi = {
      state: "known_fact",
      required: true,
      details: "Chipset model recorded"
    };
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("live_test_required");
    expect(result.checks.some((item) => item.en.includes("not live-test verified"))).toBe(true);
  });

  it("does not treat a user report as live verification", () => {
    const passport = readyPassport();
    passport.hardware.evidence.audio = {
      state: "user_reported",
      required: true,
      details: "Worked on another distro"
    };
    expect(assessMigrationReadiness(passport, assessSoftware({})).state).toBe("live_test_required");
  });

  it("does not mutate UNKNOWN evidence while assessing it", () => {
    const passport = makePassport();
    const before = structuredClone(passport.hardware.evidence);
    assessMigrationReadiness(passport, assessSoftware({}));
    expect(passport.hardware.evidence).toEqual(before);
  });

  it("blocks on any recorded live-session issue", () => {
    const passport = readyPassport();
    passport.liveTests.suspend = "issue";
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("blocked");
    expect(result.blockers.some((item) => item.en.includes("live hardware"))).toBe(true);
  });

  it("requires essential live checks that remain untested", () => {
    const passport = readyPassport();
    passport.liveTests.suspend = "not_tested";
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("live_test_required");
  });

  it("can become ready when blockers, unknowns and data gaps are resolved", () => {
    const passport = readyPassport();
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("ready");
    expect(result.strategy).toBe("linux_primary");
  });

  it("returns ready with checks when the data inventory is empty", () => {
    const passport = readyPassport();
    passport.dataMigration = {};
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("ready_with_checks");
    expect(result.checks.some((item) => item.en.includes("No data migration"))).toBe(true);
  });

  it("keeps gaming verification visible without inventing compatibility", () => {
    const passport = readyPassport();
    passport.answers.gaming = "critical";
    passport.answers.gameLaunchers = ["steam", "riot"];
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.state).toBe("ready_with_checks");
    expect(result.checks.some((item) => item.en.includes("title-by-title"))).toBe(true);
  });

  it("respects a recorded dual-boot preference when checks remain", () => {
    const passport = readyPassport();
    passport.answers.migrationMode = "dual_boot";
    passport.dataMigration = {};
    const result = assessMigrationReadiness(passport, assessSoftware({}));
    expect(result.strategy).toBe("dual_boot");
  });

  it("uses test-first for unresolved hardware in test mode", () => {
    const passport = readyPassport();
    passport.answers.migrationMode = "test";
    passport.hardware.evidence.webcam = {
      state: "unknown",
      required: true,
      details: ""
    };
    expect(assessMigrationReadiness(passport, assessSoftware({})).strategy).toBe("test_first");
  });

  it("never emits a compatibility percentage", () => {
    const result = assessMigrationReadiness(readyPassport(), assessSoftware({}));
    expect(JSON.stringify(result)).not.toMatch(/\d+%/);
  });
});

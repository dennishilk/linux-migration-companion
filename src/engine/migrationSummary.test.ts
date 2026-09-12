import { describe, expect, it } from "vitest";
import { HARDWARE_CLASS_IDS } from "../domain/defaults";
import type { MigrationPassport } from "../domain/types";
import { makePassport } from "../test/fixtures";
import { assessSoftware } from "./assess";
import {
  buildMigrationSummary,
  formatMigrationSummary
} from "./migrationSummary";
import { assessMigrationReadiness } from "./readiness";
import { recommendDistros } from "./recommend";

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
    details: "Native resolution verified"
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

function summarize(passport: MigrationPassport) {
  const software = assessSoftware(passport.softwareSelections);
  const readiness = assessMigrationReadiness(passport, software);
  return buildMigrationSummary(
    passport,
    recommendDistros(passport.answers),
    software,
    readiness
  );
}

describe("beginner-friendly migration summary", () => {
  it("names a real hard blocker and makes it the first next action without a score", () => {
    const passport = readyPassport();
    passport.softwareSelections = { photoshop: "essential" };

    const summary = summarize(passport);
    const serialized = JSON.stringify(summary);

    expect(summary.overallState).toBe("blocked");
    expect(summary.blockers[0].en).toContain("Photoshop");
    expect(summary.nextActions[0].en).toContain("Keep Windows");
    expect(summary.nextActions[0].en).toContain("supported replacement");
    expect(serialized).not.toMatch(/percentage|percent|score|points/i);
  });

  it("represents an essential unverified workflow when Windows should be retained", () => {
    const passport = readyPassport();
    passport.softwareSelections = { "enterprise-vpn": "essential" };

    const summary = summarize(passport);

    expect(summary.overallState).toBe("windows_should_be_retained");
    expect(summary.strategy).toBe("keep_windows_temporarily");
    expect(summary.stillToVerify[0].en).toContain("Enterprise VPN");
    expect(summary.nextActions[0].en).toContain("end-to-end verification");
  });

  it("surfaces unresolved required hardware for a required live test", () => {
    const passport = readyPassport();
    passport.hardware.evidence.wifi = {
      state: "known_fact",
      required: true,
      details: "Chipset was detected"
    };

    const summary = summarize(passport);

    expect(summary.overallState).toBe("live_test_required");
    expect(summary.stillToVerify[0].en).toContain("Wi-Fi");
    expect(summary.nextActions.some((item) => item.en.includes("Wi-Fi"))).toBe(true);
    expect(summary.readyItems.some((item) => item.en.includes("All required hardware"))).toBe(false);
  });

  it("keeps absent evidence unknown instead of presenting it as readiness", () => {
    const summary = summarize(makePassport());

    expect(summary.overallState).toBe("insufficient_evidence");
    expect(summary.stillToVerify[0].en).toContain("evidence is still missing");
    expect(
      summary.readyItems.some((item) =>
        /software blocker|required hardware|live-session|data migration/i.test(item.en)
      )
    ).toBe(false);
  });

  it("keeps remaining checks visible for READY WITH CHECKS", () => {
    const passport = readyPassport();
    passport.dataMigration = {};

    const summary = summarize(passport);

    expect(summary.overallState).toBe("ready_with_checks");
    expect(summary.stillToVerify.some((item) => item.en.includes("data migration"))).toBe(true);
    expect(summary.nextActions[0].en).toContain("data categories");
  });

  it("does not invent blockers or verification items for READY", () => {
    const summary = summarize(readyPassport());

    expect(summary.overallState).toBe("ready");
    expect(summary.blockers).toEqual([]);
    expect(summary.stillToVerify).toEqual([]);
    expect(summary.readyItems.some((item) => item.en.includes("All required hardware"))).toBe(true);
  });

  it("prefers an eligible selected distro, caps suggestions and excludes not-recommended profiles", () => {
    const passport = readyPassport();
    passport.selectedDistroId = "zorin-os";
    const recommendations = recommendDistros(passport.answers);
    const software = assessSoftware(passport.softwareSelections);
    const readiness = assessMigrationReadiness(passport, software);
    const selectedSummary = buildMigrationSummary(
      passport,
      recommendations,
      software,
      readiness
    );

    expect(selectedSummary.suggestedDistros[0].id).toBe("zorin-os");
    expect(selectedSummary.suggestedDistros).toHaveLength(3);
    expect(
      selectedSummary.suggestedDistros.every(
        (candidate) =>
          recommendations.find((item) => item.distro.id === candidate.id)?.tier !==
          "not_recommended"
      )
    ).toBe(true);
    expect(JSON.stringify(selectedSummary.suggestedDistros)).not.toContain("score");

    passport.selectedDistroId = "arch-linux";
    expect(summarize(passport).suggestedDistros[0].id).not.toBe("arch-linux");
  });

  it("formats localized share text without scores, Passport JSON or private free-form data", () => {
    const passport = readyPassport();
    passport.hardware.notes = "PRIVATE-HOST alice-pc SERIAL-123";
    passport.hardware.evidence.graphics.details = "PRIVATE-DEVICE-ID";
    passport.dataMigration.backups!.notes = "/home/alice/private-backup";
    const summary = summarize(passport);
    const english = formatMigrationSummary(summary, "en");
    const german = formatMigrationSummary(summary, "de");

    expect(english).toContain("Linux Migration Companion — Migration Summary");
    expect(english).toContain("Already ready:");
    expect(english).toContain("Generated locally by Linux Migration Companion.");
    expect(german).toContain("Linux Migration Companion — Migrationsübersicht");
    expect(german).toContain("Bereits bereit:");
    expect(german).toContain("Lokal mit Linux Migration Companion erstellt.");
    expect(german).not.toContain("Already ready:");

    for (const text of [english, german]) {
      expect(text).not.toMatch(/percentage|percent|score|points|Prozent|Punkte|%/i);
      expect(text).not.toContain("PRIVATE-HOST");
      expect(text).not.toContain("SERIAL-123");
      expect(text).not.toContain("PRIVATE-DEVICE-ID");
      expect(text).not.toContain("/home/alice/private-backup");
      expect(text).not.toContain("schemaVersion");
      expect(text).not.toContain("softwareSelections");
    }
  });
});

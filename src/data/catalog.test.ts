import { describe, expect, it } from "vitest";
import { distros } from "./distros";
import { questions } from "./questions";
import { softwareCatalog } from "./software";
import { hardwareClasses } from "./hardware";
import { dataMigrationDefinitions } from "./dataMigration";
import { distroComparisonById } from "./distroComparison";
import { DEFAULT_ANSWERS } from "../domain/defaults";
import { messages } from "../i18n";

describe("curated release data", () => {
  it("contains exactly the 16 scoped distro profiles with unique IDs", () => {
    expect(distros).toHaveLength(16);
    expect(new Set(distros.map((item) => item.id)).size).toBe(16);
  });

  it("contains the five reviewed post-release profiles with their intended roles", () => {
    expect(
      Object.fromEntries(
        distros
          .filter((item) => ["void-linux", "pop-os", "bazzite", "endeavouros", "kubuntu"].includes(item.id))
          .map((item) => [item.id, [item.category, item.supportDepth, item.reviewedAt]])
      )
    ).toEqual({
      kubuntu: ["mainstream", "guided", "2026-08-13"],
      "pop-os": ["mainstream", "guided", "2026-08-13"],
      bazzite: ["gaming", "reference", "2026-08-13"],
      "void-linux": ["advanced", "reference", "2026-08-13"],
      endeavouros: ["advanced", "reference", "2026-08-13"]
    });
  });

  it("uses official handoff domains for every newly added profile", () => {
    const expectedDomains: Record<string, string[]> = {
      kubuntu: ["kubuntu.org", "cdimage.ubuntu.com"],
      "pop-os": ["system76.com", "support.system76.com"],
      bazzite: ["bazzite.gg", "docs.bazzite.gg"],
      "void-linux": ["voidlinux.org", "docs.voidlinux.org"],
      endeavouros: ["endeavouros.com", "discovery.endeavouros.com"]
    };
    for (const [id, domains] of Object.entries(expectedDomains)) {
      const distro = distros.find((item) => item.id === id);
      expect(distro, id).toBeDefined();
      for (const url of [
        distro?.officialHome,
        distro?.downloadUrl,
        distro?.verifyUrl,
        distro?.installUrl
      ]) {
        expect(domains, `${id}: ${url}`).toContain(new URL(url ?? "").hostname);
      }
    }
  });

  it("states support depth for every distro", () => {
    expect(distros.every((item) => ["guided", "reference", "experimental"].includes(item.supportDepth))).toBe(true);
    expect(distros.filter((item) => item.supportDepth === "guided").length).toBeGreaterThanOrEqual(6);
  });

  it("uses official HTTPS handoff links and review dates", () => {
    for (const distro of distros) {
      expect(distro.downloadUrl, distro.id).toMatch(/^https:\/\//);
      expect(distro.verifyUrl, distro.id).toMatch(/^https:\/\//);
      expect(distro.installUrl, distro.id).toMatch(/^https:\/\//);
      expect(distro.reviewedAt).toMatch(/^2026-08-(11|13)$/);
    }
  });

  it("contains exactly 90 unique software workflows", () => {
    expect(softwareCatalog).toHaveLength(90);
    expect(new Set(softwareCatalog.map((item) => item.id)).size).toBe(90);
  });

  it("gives every software workflow a route, source, review date and bilingual copy", () => {
    for (const software of softwareCatalog) {
      expect(software.routes.length, software.id).toBeGreaterThan(0);
      expect(software.sourceUrl, software.id).toMatch(/^https:\/\//);
      expect(software.reviewedAt).toBe("2026-08-11");
      expect(["application", "workflow"]).toContain(software.scope);
      expect(["stable", "volatile"]).toContain(software.freshness);
      expect(software.summary.en.length).toBeGreaterThan(15);
      expect(software.summary.de.length).toBeGreaterThan(15);
    }
  });

  it("contains the 19 required hardware evidence classes exactly once", () => {
    expect(hardwareClasses).toHaveLength(19);
    expect(new Set(hardwareClasses.map((item) => item.id)).size).toBe(19);
    expect(hardwareClasses.some((item) => item.id === "hybrid_graphics")).toBe(true);
    expect(hardwareClasses.some((item) => item.id === "racing_wheel")).toBe(true);
  });

  it("contains 19 unique data-migration categories with bilingual copy", () => {
    expect(dataMigrationDefinitions).toHaveLength(19);
    expect(new Set(dataMigrationDefinitions.map((item) => item.id)).size).toBe(19);
    for (const item of dataMigrationDefinitions) {
      expect(item.title.en.length).toBeGreaterThan(2);
      expect(item.title.de.length).toBeGreaterThan(2);
    }
  });

  it("provides migration-relevant comparison facts for every distro", () => {
    expect(Object.keys(distroComparisonById).sort()).toEqual(distros.map((item) => item.id).sort());
    for (const distro of distros) {
      const comparison = distroComparisonById[distro.id];
      expect(Object.keys(comparison).sort()).toEqual([
        "beginner",
        "ecosystem",
        "gaming",
        "installation",
        "nvidia",
        "recovery",
        "troubleshooting"
      ]);
      for (const value of [
        distro.summary,
        distro.maintenance,
        distro.desktop,
        ...Object.values(comparison)
      ]) {
        expect(value.en.length, `${distro.id} EN`).toBeGreaterThan(20);
        expect(value.de.length, `${distro.id} DE`).toBeGreaterThan(20);
      }
    }
  });

  it("marks compatibility-sensitive catalog claims as volatile", () => {
    const sensitive = softwareCatalog.filter((item) =>
      item.routes.some((route) => ["compatibility_layer", "manual_verification_required", "no_real_equivalent"].includes(route))
    );
    expect(sensitive.length).toBeGreaterThan(40);
    expect(sensitive.every((item) => item.freshness === "volatile")).toBe(true);
  });

  it("contains no duplicate source-less or non-HTTPS software entries", () => {
    expect(softwareCatalog.every((item) => item.sourceLabel.trim().length > 3)).toBe(true);
    expect(softwareCatalog.every((item) => item.sourceUrl.startsWith("https://"))).toBe(true);
  });

  it("asks once for every scalar advisor field", () => {
    const scalarFields = Object.keys(DEFAULT_ANSWERS).filter((field) => field !== "gameLaunchers");
    expect(questions.map((question) => question.field).sort()).toEqual(scalarFields.sort());
  });

  it("asks for system properties rather than named specialist distributions", () => {
    const question = questions.find((item) => item.field === "systemInterest");
    expect(question?.question.en).toContain("how the system is assembled");
    expect(question?.question.de).toContain("wie das System aufgebaut ist");
    expect(JSON.stringify(question)).not.toMatch(/Arch|Gentoo|NixOS|Void|Bazzite/);
  });

  it("keeps the static DE and EN message contracts aligned", () => {
    expect(Object.keys(messages.de).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.keys(messages.de.sections).sort()).toEqual(Object.keys(messages.en.sections).sort());
  });
});

import { describe, expect, it } from "vitest";
import { distros } from "./distros";
import { questions } from "./questions";
import { softwareCatalog } from "./software";
import { DEFAULT_ANSWERS } from "../domain/defaults";
import { messages } from "../i18n";

describe("curated Alpha data", () => {
  it("contains exactly the 11 scoped distro profiles with unique IDs", () => {
    expect(distros).toHaveLength(11);
    expect(new Set(distros.map((item) => item.id)).size).toBe(11);
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
      expect(distro.reviewedAt).toBe("2026-08-10");
    }
  });

  it("contains exactly 60 unique software workflows", () => {
    expect(softwareCatalog).toHaveLength(60);
    expect(new Set(softwareCatalog.map((item) => item.id)).size).toBe(60);
  });

  it("gives every software workflow a route, source, review date and bilingual copy", () => {
    for (const software of softwareCatalog) {
      expect(software.routes.length, software.id).toBeGreaterThan(0);
      expect(software.sourceUrl, software.id).toMatch(/^https:\/\//);
      expect(software.reviewedAt).toBe("2026-08-10");
      expect(software.summary.en.length).toBeGreaterThan(15);
      expect(software.summary.de.length).toBeGreaterThan(15);
    }
  });

  it("asks once for every scalar advisor field", () => {
    const scalarFields = Object.keys(DEFAULT_ANSWERS).filter((field) => field !== "gameLaunchers");
    expect(questions.map((question) => question.field).sort()).toEqual(scalarFields.sort());
  });

  it("keeps the static DE and EN message contracts aligned", () => {
    expect(Object.keys(messages.de).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.keys(messages.de.sections).sort()).toEqual(Object.keys(messages.en.sections).sort());
  });
});

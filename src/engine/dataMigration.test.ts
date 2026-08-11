import { describe, expect, it } from "vitest";
import { dataMigrationDefinitions } from "../data/dataMigration";
import type { DataMigrationMethod, DataMigrationSelections } from "../domain/types";
import { buildDataMigrationAssessment } from "./dataMigration";

describe("data migration planning", () => {
  it("defines exactly 19 unique migration categories", () => {
    expect(dataMigrationDefinitions).toHaveLength(19);
    expect(new Set(dataMigrationDefinitions.map((item) => item.id)).size).toBe(19);
  });

  it("keeps an empty inventory explicitly incomplete", () => {
    expect(buildDataMigrationAssessment({})).toEqual({
      items: [],
      hasEssentialItems: false,
      needsManualChecks: false,
      evidenceComplete: false
    });
  });

  it("preserves importance, method and local notes", () => {
    const result = buildDataMigrationAssessment({
      documents: { importance: "essential", method: "copy", notes: "Restored three files" }
    });
    expect(result.items[0]).toMatchObject({
      id: "documents",
      importance: "essential",
      method: "copy",
      notes: "Restored three files"
    });
  });

  it("marks a plan with essential data", () => {
    const result = buildDataMigrationAssessment({
      photos: { importance: "essential", method: "copy", notes: "" }
    });
    expect(result.hasEssentialItems).toBe(true);
  });

  it("marks manual-check methods for explicit review", () => {
    const result = buildDataMigrationAssessment({
      backups: { importance: "important", method: "manual_check", notes: "" }
    });
    expect(result.needsManualChecks).toBe(true);
  });

  it("marks DO NOT ASSUME methods for explicit review", () => {
    const result = buildDataMigrationAssessment({
      application_data: { importance: "important", method: "do_not_assume", notes: "" }
    });
    expect(result.needsManualChecks).toBe(true);
  });

  it("requires a recorded backup before evidence can be complete", () => {
    const result = buildDataMigrationAssessment({
      documents: { importance: "essential", method: "copy", notes: "" }
    });
    expect(result.evidenceComplete).toBe(false);
  });

  it("accepts a backup record when no essential DO NOT ASSUME item remains", () => {
    const result = buildDataMigrationAssessment({
      documents: { importance: "essential", method: "copy", notes: "" },
      backups: { importance: "essential", method: "manual_check", notes: "Restore tested" }
    });
    expect(result.evidenceComplete).toBe(true);
  });

  it("keeps evidence incomplete for an essential DO NOT ASSUME item", () => {
    const result = buildDataMigrationAssessment({
      application_data: { importance: "essential", method: "do_not_assume", notes: "Unknown format" },
      backups: { importance: "essential", method: "manual_check", notes: "Restore tested" }
    });
    expect(result.evidenceComplete).toBe(false);
  });

  it("has a bilingual warning and recommended method for every category", () => {
    for (const item of dataMigrationDefinitions) {
      expect(item.warning.en.length, item.id).toBeGreaterThan(20);
      expect(item.warning.de.length, item.id).toBeGreaterThan(20);
      expect(["copy", "sync", "export_import", "reconfigure", "manual_check", "do_not_assume"]).toContain(item.recommendedMethod);
    }
  });

  it("builds explanatory actions for every method without executable commands", () => {
    const methods: DataMigrationMethod[] = ["copy", "sync", "export_import", "reconfigure", "manual_check", "do_not_assume"];
    const selections = Object.fromEntries(
      methods.map((method, index) => [
        dataMigrationDefinitions[index].id,
        { importance: "important", method, notes: "" }
      ])
    ) as DataMigrationSelections;
    const result = buildDataMigrationAssessment(selections);
    expect(result.items).toHaveLength(methods.length);
    expect(JSON.stringify(result)).not.toMatch(/\bsudo\b|\brobocopy\b|\brsync\s|\bcp\s/i);
  });

  it("ignores unknown in-memory identifiers defensively", () => {
    const selections = {
      unknown_item: { importance: "essential", method: "copy", notes: "" }
    } as unknown as DataMigrationSelections;
    expect(buildDataMigrationAssessment(selections).items).toHaveLength(0);
  });
});

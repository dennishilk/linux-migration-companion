import { dataMigrationById } from "../data/dataMigration";
import type {
  DataMigrationAssessment,
  DataMigrationId,
  DataMigrationMethod,
  DataMigrationSelections,
  LocalizedText
} from "../domain/types";

const methodActions: Record<DataMigrationMethod, LocalizedText> = {
  copy: {
    en: "Copy from a verified source to a separate destination, then open representative files.",
    de: "Von einer geprüften Quelle auf ein getrenntes Ziel kopieren und anschließend repräsentative Dateien öffnen."
  },
  sync: {
    en: "Confirm that the sync completed and that cloud placeholders are available offline before changing Windows.",
    de: "Abgeschlossene Synchronisation und lokale Verfügbarkeit von Cloud-Platzhaltern bestätigen, bevor Windows verändert wird."
  },
  export_import: {
    en: "Use the application's documented export, preserve the original, and test an import into a disposable profile.",
    de: "Den dokumentierten Export der Anwendung nutzen, das Original behalten und den Import in einem entbehrlichen Profil testen."
  },
  reconfigure: {
    en: "Record the required settings and rebuild the workflow without copying credentials into this Passport.",
    de: "Benötigte Einstellungen erfassen und den Ablauf neu einrichten, ohne Zugangsdaten in diesen Passport zu kopieren."
  },
  manual_check: {
    en: "Inspect the source, backup method and restore path manually; do not infer completeness from a folder name.",
    de: "Quelle, Backupmethode und Wiederherstellungsweg manuell prüfen; Vollständigkeit nicht aus einem Ordnernamen ableiten."
  },
  do_not_assume: {
    en: "Stop and verify the product-specific migration path before treating this data as portable.",
    de: "Anhalten und den produktspezifischen Migrationsweg prüfen, bevor diese Daten als portabel gelten."
  }
};

export function buildDataMigrationAssessment(
  selections: DataMigrationSelections
): DataMigrationAssessment {
  const items = Object.entries(selections).flatMap(([id, selection]) => {
    const definition = dataMigrationById.get(id as DataMigrationId);
    if (!definition || !selection) return [];
    return [
      {
        id: definition.id,
        title: definition.title,
        importance: selection.importance,
        method: selection.method,
        action: methodActions[selection.method],
        warning: definition.warning,
        notes: selection.notes
      }
    ];
  });

  return {
    items,
    hasEssentialItems: items.some((item) => item.importance === "essential"),
    needsManualChecks: items.some(
      (item) => item.method === "manual_check" || item.method === "do_not_assume"
    ),
    evidenceComplete:
      items.length > 0 &&
      items.some((item) => item.id === "backups") &&
      !items.some(
        (item) => item.importance === "essential" && item.method === "do_not_assume"
      )
  };
}

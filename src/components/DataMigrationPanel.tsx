import { dataMigrationDefinitions } from "../data/dataMigration";
import type {
  DataMigrationId,
  DataMigrationMethod,
  DataMigrationSelections,
  Locale
} from "../domain/types";
import { buildDataMigrationAssessment } from "../engine/dataMigration";
import { localize } from "../i18n";

interface DataMigrationPanelProps {
  locale: Locale;
  selections: DataMigrationSelections;
  onChange: (selections: DataMigrationSelections) => void;
  onContinue: () => void;
}

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const methods: DataMigrationMethod[] = [
  "copy",
  "sync",
  "export_import",
  "reconfigure",
  "manual_check",
  "do_not_assume"
];

const methodLabels: Record<DataMigrationMethod, { en: string; de: string }> = {
  copy: { en: "COPY", de: "KOPIEREN" },
  sync: { en: "SYNC", de: "SYNCHRONISIEREN" },
  export_import: { en: "EXPORT / IMPORT", de: "EXPORT / IMPORT" },
  reconfigure: { en: "RECONFIGURE", de: "NEU EINRICHTEN" },
  manual_check: { en: "MANUAL CHECK", de: "MANUELL PRÜFEN" },
  do_not_assume: { en: "DO NOT ASSUME", de: "NICHT ANNEHMEN" }
};

export function DataMigrationPanel({
  locale,
  selections,
  onChange,
  onContinue
}: DataMigrationPanelProps) {
  const assessment = buildDataMigrationAssessment(selections);

  const add = (id: DataMigrationId, method: DataMigrationMethod) => {
    onChange({
      ...selections,
      [id]: { importance: "important", method, notes: "" }
    });
  };

  const update = (
    id: DataMigrationId,
    change: Partial<NonNullable<DataMigrationSelections[DataMigrationId]>>
  ) => {
    const current = selections[id];
    if (!current) return;
    onChange({ ...selections, [id]: { ...current, ...change } });
  };

  const remove = (id: DataMigrationId) => {
    const next = { ...selections };
    delete next[id];
    onChange(next);
  };

  return (
    <section aria-labelledby="data-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">07 / DATA MIGRATION</p>
          <h1 id="data-title">{copy(locale, "Plan the data, not just the operating system", "Die Daten planen – nicht nur das Betriebssystem")}</h1>
          <p>{copy(locale, "Select what actually matters and record the migration method. The Companion does not copy, sync, decrypt or upload anything.", "Wähle die wirklich wichtigen Daten und erfasse die Migrationsmethode. Der Companion kopiert, synchronisiert, entschlüsselt und lädt nichts hoch.")}</p>
        </div>
        <div className="data-summary" aria-live="polite">
          <strong>{assessment.items.length} {copy(locale, "items", "Punkte")}</strong>
          <span>{assessment.hasEssentialItems ? copy(locale, "Contains essential data", "Enthält unverzichtbare Daten") : copy(locale, "Nothing marked essential", "Nichts als unverzichtbar markiert")}</span>
        </div>
      </div>

      <div className="notice notice-blocker">
        <strong>{copy(locale, "BACK UP FIRST", "ZUERST SICHERN")}</strong>
        <p>{copy(locale, "Keep at least one independent backup disconnected from the migration machine and prove that representative files can be restored.", "Mindestens ein unabhängiges Backup getrennt vom Migrationsrechner aufbewahren und die Wiederherstellung repräsentativer Dateien nachweisen.")}</p>
      </div>

      <div className="data-migration-grid">
        {dataMigrationDefinitions.map((definition) => {
          const selection = selections[definition.id];
          return (
            <article className={selection ? "data-card selected" : "data-card"} key={definition.id}>
              <header>
                <h2>{localize(definition.title, locale)}</h2>
                <p>{localize(definition.description, locale)}</p>
              </header>
              <aside>
                <strong>{copy(locale, "Do not miss", "Nicht übersehen")}</strong>
                <p>{localize(definition.warning, locale)}</p>
              </aside>
              {selection ? (
                <div className="data-fields">
                  <label className="stacked-field">
                    <span>{copy(locale, "Importance", "Wichtigkeit")}</span>
                    <select
                      value={selection.importance}
                      onChange={(event) => update(definition.id, { importance: event.target.value as "important" | "essential" })}
                    >
                      <option value="important">{copy(locale, "Important", "Wichtig")}</option>
                      <option value="essential">{copy(locale, "Essential", "Unverzichtbar")}</option>
                    </select>
                  </label>
                  <label className="stacked-field">
                    <span>{copy(locale, "Method", "Methode")}</span>
                    <select
                      value={selection.method}
                      onChange={(event) => update(definition.id, { method: event.target.value as DataMigrationMethod })}
                    >
                      {methods.map((method) => (
                        <option value={method} key={method}>{methodLabels[method][locale]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="stacked-field data-notes">
                    <span>{copy(locale, "Local notes", "Lokale Notizen")}</span>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={selection.notes}
                      placeholder={copy(locale, "Location, export status or restore evidence; never passwords or private keys.", "Ort, Exportstatus oder Wiederherstellungsnachweis – niemals Passwörter oder private Schlüssel.")}
                      onChange={(event) => update(definition.id, { notes: event.target.value })}
                    />
                    <small>{selection.notes.length} / 500</small>
                  </label>
                  <button type="button" className="button ghost compact" onClick={() => remove(definition.id)}>
                    {copy(locale, "Remove", "Entfernen")}
                  </button>
                </div>
              ) : (
                <button type="button" className="button secondary compact" onClick={() => add(definition.id, definition.recommendedMethod)}>
                  {copy(locale, `Add as ${methodLabels[definition.recommendedMethod].en}`, `Als ${methodLabels[definition.recommendedMethod].de} hinzufügen`)}
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div className="evidence-boundary">
        <strong>{copy(locale, "Windows data boundary", "Windows-Datengrenze")}</strong>
        <p>{copy(locale, "Resolve BitLocker before repartitioning. Make cloud placeholders available offline. Disable Windows Fast Startup before relying on shared NTFS access, and never copy an active proprietary database as if it were an ordinary document.", "BitLocker vor der Partitionierung klären. Cloud-Platzhalter offline verfügbar machen. Windows-Schnellstart deaktivieren, bevor gemeinsamer NTFS-Zugriff eingeplant wird, und eine aktive proprietäre Datenbank niemals wie ein normales Dokument kopieren.")}</p>
      </div>

      <div className="panel-actions sticky-actions">
        <span>{assessment.evidenceComplete ? copy(locale, "Backup recorded; verify restore", "Backup erfasst; Wiederherstellung prüfen") : copy(locale, "Data evidence remains incomplete", "Daten-Evidenz ist noch unvollständig")}</span>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Prepare test media", "Testmedium vorbereiten")}
        </button>
      </div>
    </section>
  );
}

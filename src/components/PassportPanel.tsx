import { useRef, useState } from "react";
import { dataMigrationById } from "../data/dataMigration";
import { distroById } from "../data/distros";
import { hardwareClassById } from "../data/hardware";
import type {
  DistroRecommendation,
  LiveReadiness,
  Locale,
  MigrationPassport,
  ReadinessAssessment,
  SoftwareAssessment
} from "../domain/types";
import { buildDataMigrationAssessment } from "../engine/dataMigration";
import { localize, t } from "../i18n";
import { parsePassportText, serializePassport } from "../passport/schema";

interface PassportPanelProps {
  locale: Locale;
  passport: MigrationPassport;
  recommendations: DistroRecommendation[];
  softwareAssessment: SoftwareAssessment;
  liveReadiness: LiveReadiness;
  migrationReadiness: ReadinessAssessment;
  onImport: (passport: MigrationPassport) => void;
  onContinue: () => void;
}

type ImportState = "idle" | "success" | "error";

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const strategyText: Record<ReadinessAssessment["strategy"], { en: string; de: string }> = {
  linux_primary: { en: "LINUX PRIMARY", de: "LINUX PRIMÄR" },
  test_first: { en: "TEST FIRST", de: "ZUERST TESTEN" },
  dual_boot: { en: "DUAL BOOT", de: "DUAL BOOT" },
  keep_windows_temporarily: { en: "KEEP WINDOWS TEMPORARILY", de: "WINDOWS VORERST BEHALTEN" },
  keep_windows_for_workflows: { en: "KEEP WINDOWS FOR WORKFLOWS", de: "WINDOWS FÜR ABLÄUFE BEHALTEN" },
  migration_blocked: { en: "MIGRATION BLOCKED", de: "MIGRATION BLOCKIERT" }
};

export function PassportPanel({
  locale,
  passport,
  recommendations,
  softwareAssessment,
  liveReadiness,
  migrationReadiness,
  onImport,
  onContinue
}: PassportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>("idle");
  const selected =
    recommendations.find((item) => item.distro.id === passport.selectedDistroId) ??
    recommendations[0];
  const compared = passport.comparisonDistroIds
    .map((id) => distroById.get(id))
    .filter((distro) => distro !== undefined);
  const dataAssessment = buildDataMigrationAssessment(passport.dataMigration);
  const hardwareItems = Object.entries(passport.hardware.evidence);
  const requiredHardware = hardwareItems.filter(([, evidence]) => evidence.required);
  const verifiedHardware = requiredHardware.filter(([, evidence]) => evidence.state === "live_verified");
  const unresolvedHardware = requiredHardware.filter(([, evidence]) =>
    ["unknown", "known_fact", "user_reported"].includes(evidence.state)
  );

  const exportPassport = () => {
    const text = serializePassport(passport);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `migration-passport-v2-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importPassport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parsePassportText(await file.text());
      onImport(parsed);
      setImportState("success");
    } catch {
      setImportState("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const blockerText = migrationReadiness.blockers.length
    ? migrationReadiness.blockers.map((item) => localize(item, locale)).join(" · ")
    : t(locale, "noBlocker");

  return (
    <section aria-labelledby="passport-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">09 / LOCAL EVIDENCE · SCHEMA V2</p>
          <h1 id="passport-title">{t(locale, "passportTitle")} 2.0</h1>
          <p>{t(locale, "passportLead")}</p>
        </div>
        <div className="passport-actions">
          <button type="button" className="button secondary" onClick={exportPassport}>
            {t(locale, "export")}
          </button>
          <button type="button" className="button secondary" onClick={() => inputRef.current?.click()}>
            {t(locale, "import")}
          </button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label={copy(locale, "Choose Passport JSON file", "Passport-JSON-Datei auswählen")}
            onChange={(event) => void importPassport(event.target.files?.[0])}
          />
        </div>
      </div>

      {importState !== "idle" ? (
        <div className={`notice ${importState === "success" ? "notice-info" : "notice-blocker"}`} role="status">
          <strong>{importState === "success" ? t(locale, "importSuccess") : t(locale, "importError")}</strong>
          {importState === "error" ? (
            <p>{copy(locale, "Strict Passport v1 and v2 files up to 256 KiB are accepted. Unknown IDs, extra fields, excessive depth and invalid versions are rejected.", "Strikte Passport-v1- und v2-Dateien bis 256 KiB werden akzeptiert. Unbekannte IDs, zusätzliche Felder, übermäßige Tiefe und ungültige Versionen werden abgewiesen.")}</p>
          ) : (
            <p>{copy(locale, "Passport v1 imports are explicitly migrated to schema v2 without inventing new evidence.", "Passport-v1-Importe werden ausdrücklich auf Schema v2 migriert, ohne neue Evidenz zu erfinden.")}</p>
          )}
        </div>
      ) : null}

      <div className="passport-grid passport-grid-v2">
        <article className="passport-card passport-primary">
          <span>{t(locale, "primary")}</span>
          <h2>{selected?.distro.name ?? copy(locale, "Not selected", "Nicht ausgewählt")}</h2>
          <p>{selected ? t(locale, selected.tier) : "—"}</p>
          <small>{compared.map((item) => item.name).join(" · ") || copy(locale, "No comparison set", "Kein Vergleichssatz")}</small>
        </article>

        <article className={`passport-card passport-${softwareAssessment.overall}`}>
          <span>{t(locale, "software")}</span>
          <h2>{softwareAssessment.items.length}</h2>
          <p>{softwareAssessment.overall.toUpperCase()}</p>
          <small>{softwareAssessment.blockers.length} {copy(locale, "blocker(s)", "Blocker")}</small>
        </article>

        <article className={`passport-card passport-${liveReadiness}`}>
          <span>{t(locale, "hardware")}</span>
          <h2>{verifiedHardware.length} / {requiredHardware.length}</h2>
          <p>{copy(locale, "LIVE VERIFIED", "LIVE VERIFIZIERT")}</p>
          <small>{unresolvedHardware.length} UNKNOWN · {passport.hardware.gpuVendor.toUpperCase()}</small>
        </article>

        <article className={`passport-card readiness-state-${migrationReadiness.state}`}>
          <span>{copy(locale, "Migration strategy", "Migrationsstrategie")}</span>
          <h2>{strategyText[migrationReadiness.strategy][locale]}</h2>
          <p>{migrationReadiness.state.replaceAll("_", " ").toUpperCase()}</p>
          <small>{migrationReadiness.checks.length} {copy(locale, "open check(s)", "offene Prüfungen")}</small>
        </article>

        <article className="passport-card">
          <span>{copy(locale, "Data migration", "Datenmigration")}</span>
          <h2>{dataAssessment.items.length}</h2>
          <p>{dataAssessment.evidenceComplete ? copy(locale, "BACKUP RECORDED", "BACKUP ERFASST") : copy(locale, "INCOMPLETE", "UNVOLLSTÄNDIG")}</p>
          <small>{dataAssessment.needsManualChecks ? copy(locale, "Manual checks remain", "Manuelle Prüfungen offen") : copy(locale, "No manual flag", "Keine manuelle Markierung")}</small>
        </article>

        <article className="passport-card">
          <span>{t(locale, "gaming")}</span>
          <h2>{passport.answers.gaming.toUpperCase()}</h2>
          <p>{passport.answers.gameLaunchers.join(" · ") || "—"}</p>
          <small>{t(locale, "gamesUnverified")}</small>
        </article>
      </div>

      <div className="passport-decision">
        <div>
          <span>{t(locale, "blocker")}</span>
          <strong>{blockerText}</strong>
        </div>
        <div>
          <span>{copy(locale, "Windows decision", "Windows-Entscheidung")}</span>
          <strong>{strategyText[migrationReadiness.strategy][locale]}</strong>
        </div>
      </div>

      <div className="passport-evidence-sections">
        <details open={softwareAssessment.blockers.length > 0}>
          <summary>{copy(locale, "Software workflows requiring verification", "Zu prüfende Software-Arbeitsabläufe")}</summary>
          {softwareAssessment.items.filter((item) => item.risk !== "low").length ? (
            <ul>
              {softwareAssessment.items.filter((item) => item.risk !== "low").map((item) => (
                <li key={item.record.id}>
                  <strong>{item.record.name}</strong>
                  <span>{item.priority.toUpperCase()} · {item.risk.toUpperCase()} · {item.record.scope.toUpperCase()}</span>
                </li>
              ))}
            </ul>
          ) : <p>{copy(locale, "No selected software workflow currently carries a medium, high or blocker classification.", "Kein ausgewählter Software-Ablauf trägt derzeit eine mittlere, hohe oder Blocker-Einstufung.")}</p>}
        </details>

        <details open={unresolvedHardware.length > 0}>
          <summary>{copy(locale, "Required hardware evidence", "Evidenz für benötigte Hardware")}</summary>
          {requiredHardware.length ? (
            <ul>
              {requiredHardware.map(([id, evidence]) => (
                <li key={id}>
                  <strong>{localize(hardwareClassById.get(id as keyof typeof passport.hardware.evidence)!.title, locale)}</strong>
                  <span>{evidence.state.replaceAll("_", " ").toUpperCase()}{evidence.details ? ` · ${evidence.details}` : ""}</span>
                </li>
              ))}
            </ul>
          ) : <p>{copy(locale, "No hardware class is marked required.", "Keine Hardwareklasse ist als benötigt markiert.")}</p>}
        </details>

        <details>
          <summary>{copy(locale, "Data migration considerations", "Überlegungen zur Datenmigration")}</summary>
          {dataAssessment.items.length ? (
            <ul>
              {dataAssessment.items.map((item) => (
                <li key={item.id}>
                  <strong>{localize(dataMigrationById.get(item.id)!.title, locale)}</strong>
                  <span>{item.importance.toUpperCase()} · {item.method.replaceAll("_", " ").toUpperCase()}</span>
                </li>
              ))}
            </ul>
          ) : <p>{copy(locale, "No data inventory has been recorded. This remains an explicit UNKNOWN, not a pass.", "Kein Dateninventar wurde erfasst. Dies bleibt ausdrücklich UNBEKANNT und gilt nicht als bestanden.")}</p>}
        </details>
      </div>

      <details className="json-preview">
        <summary>{copy(locale, "Inspect complete exported data", "Vollständige Exportdaten ansehen")}</summary>
        <p>{copy(locale, "This is the complete local Passport. It contains no automatic device identifiers, accounts or uploaded files. Do not put passwords or private keys in notes.", "Dies ist der vollständige lokale Passport. Er enthält keine automatischen Gerätekennungen, Konten oder hochgeladenen Dateien. Keine Passwörter oder privaten Schlüssel in Notizen eintragen.")}</p>
        <pre>{serializePassport(passport)}</pre>
      </details>

      <div className="panel-actions">
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Build First Boot Plan 2.0", "First Boot Plan 2.0 erstellen")}
        </button>
      </div>
    </section>
  );
}

import { useRef, useState } from "react";
import { dataMigrationById } from "../data/dataMigration";
import { distroById } from "../data/distros";
import { hardwareClassById } from "../data/hardware";
import type {
  DistroRecommendation,
  HardwareClassId,
  HardwareSnapshotCategory,
  HardwareSnapshotSource,
  LiveReadiness,
  Locale,
  MigrationPassport,
  ReadinessAssessment,
  SoftwareAssessment
} from "../domain/types";
import { buildDataMigrationAssessment } from "../engine/dataMigration";
import {
  buildMigrationSummary,
  formatMigrationSummary,
  migrationSummaryStatus,
  migrationSummaryStrategy
} from "../engine/migrationSummary";
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
type CopyState = "idle" | "success" | "error";

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const supplementalHardwareLabels: Partial<
  Record<HardwareSnapshotCategory, { en: string; de: string }>
> = {
  cpu: { en: "CPU", de: "CPU" },
  storage: { en: "Storage", de: "Speichergerät" },
  usb_controller: { en: "USB controller", de: "USB-Controller" },
  input_device: { en: "Input device", de: "Eingabegerät" },
  display: { en: "Display", de: "Bildschirm" }
};

function snapshotCategoryText(
  category: HardwareSnapshotCategory,
  locale: Locale
): string {
  const hardware = hardwareClassById.get(category as HardwareClassId);
  if (hardware) return localize(hardware.title, locale);
  return supplementalHardwareLabels[category]?.[locale] ?? category;
}

function snapshotSourceText(
  source: HardwareSnapshotSource,
  locale: Locale
): string {
  if (source === "browser_reported") {
    return copy(locale, "Browser reported", "Vom Browser gemeldet");
  }
  if (source === "windows_collector") {
    return copy(locale, "Windows collector", "Windows-Collector");
  }
  return copy(locale, "Linux collector", "Linux-Collector");
}

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
  const [copyState, setCopyState] = useState<CopyState>("idle");
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
  const hardwareSnapshot = passport.hardware.snapshot;
  const migrationSummary = buildMigrationSummary(
    passport,
    recommendations,
    softwareAssessment,
    migrationReadiness
  );

  const exportPassport = () => {
    const text = serializePassport(passport);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `migration-passport-v3-${new Date().toISOString().slice(0, 10)}.json`;
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
      setCopyState("idle");
    } catch {
      setImportState("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const copyMigrationSummary = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(
        formatMigrationSummary(migrationSummary, locale)
      );
      setCopyState("success");
    } catch {
      setCopyState("error");
    }
  };

  const blockerText = migrationReadiness.blockers.length
    ? migrationReadiness.blockers.map((item) => localize(item, locale)).join(" · ")
    : t(locale, "noBlocker");

  return (
    <section aria-labelledby="passport-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">09 / LOCAL EVIDENCE · SCHEMA V3</p>
          <h1 id="passport-title">{t(locale, "passportTitle")} 3.0</h1>
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
            <p>{copy(locale, "Strict Passport v1, v2 and v3 files up to 256 KiB are accepted. Unknown IDs, extra fields, excessive depth and invalid versions are rejected.", "Strikte Passport-v1-, v2- und v3-Dateien bis 256 KiB werden akzeptiert. Unbekannte IDs, zusätzliche Felder, übermäßige Tiefe und ungültige Versionen werden abgewiesen.")}</p>
          ) : (
            <p>{copy(locale, "Earlier Passport v1 and v2 imports are explicitly migrated to schema v3 without inventing snapshot or live evidence.", "Ältere Passport-v1- und v2-Importe werden ausdrücklich auf Schema v3 migriert, ohne Snapshot- oder Live-Evidenz zu erfinden.")}</p>
          )}
        </div>
      ) : null}

      <section
        className={`migration-summary readiness-state-${migrationSummary.overallState}`}
        aria-labelledby="migration-summary-title"
      >
        <header className="migration-summary-header">
          <div>
            <h2 id="migration-summary-title">
              {copy(locale, "Your migration summary", "Deine Migrationsübersicht")}
            </h2>
            <p>
              {copy(
                locale,
                "A quick overview of what looks ready, what still needs proof, and what to do next.",
                "Ein kurzer Überblick darüber, was schon gut aussieht, was noch geprüft werden muss und was als Nächstes sinnvoll ist."
              )}
            </p>
          </div>
          <div className="migration-summary-copy">
            <button
              type="button"
              className="button secondary"
              onClick={() => void copyMigrationSummary()}
            >
              {copy(locale, "Copy summary", "Zusammenfassung kopieren")}
            </button>
            <p role="status" aria-live="polite">
              {copyState === "success"
                ? copy(
                    locale,
                    "Summary copied to the clipboard.",
                    "Zusammenfassung wurde in die Zwischenablage kopiert."
                  )
                : copyState === "error"
                  ? copy(
                      locale,
                      "The summary could not be copied. Clipboard access may be unavailable.",
                      "Die Zusammenfassung konnte nicht kopiert werden. Der Zugriff auf die Zwischenablage ist möglicherweise nicht verfügbar."
                    )
                  : ""}
            </p>
          </div>
        </header>

        <div className="migration-summary-overview">
          <article>
            <h3>{copy(locale, "Current status", "Aktueller Status")}</h3>
            <strong>
              {migrationSummaryStatus(migrationSummary.overallState, locale)}
            </strong>
          </article>
          <article>
            <h3>{copy(locale, "Recommended strategy", "Empfohlene Strategie")}</h3>
            <strong>
              {migrationSummaryStrategy(migrationSummary.strategy, locale)}
            </strong>
          </article>
        </div>

        <div className="migration-summary-sections">
          <article>
            <h3>{copy(locale, "Already ready", "Bereits bereit")}</h3>
            {migrationSummary.readyItems.length ? (
              <ul>
                {migrationSummary.readyItems.map((item) => (
                  <li key={item.en}>{localize(item, locale)}</li>
                ))}
              </ul>
            ) : (
              <p>
                {copy(
                  locale,
                  "No readiness claim is supported yet.",
                  "Noch ist keine Bereitschaftsaussage ausreichend belegt."
                )}
              </p>
            )}
          </article>

          <article>
            <h3>{copy(locale, "Still to verify", "Noch zu prüfen")}</h3>
            {migrationSummary.stillToVerify.length ? (
              <ul>
                {migrationSummary.stillToVerify.map((item) => (
                  <li key={item.en}>{localize(item, locale)}</li>
                ))}
              </ul>
            ) : (
              <p>
                {copy(
                  locale,
                  "No required verification is currently open.",
                  "Derzeit ist keine erforderliche Prüfung offen."
                )}
              </p>
            )}
          </article>

          <article>
            <h3>{copy(locale, "Blockers", "Blocker")}</h3>
            {migrationSummary.blockers.length ? (
              <ul>
                {migrationSummary.blockers.map((item) => (
                  <li key={item.en}>{localize(item, locale)}</li>
                ))}
              </ul>
            ) : (
              <p>
                {copy(
                  locale,
                  "No active blocker is recorded. Remaining unknowns and checks still matter.",
                  "Kein aktiver Blocker ist erfasst. Verbleibende Unklarheiten und Prüfungen sind weiterhin wichtig."
                )}
              </p>
            )}
          </article>

          <article>
            <h3>
              {copy(locale, "Suggested distributions", "Vorgeschlagene Distributionen")}
            </h3>
            {migrationSummary.suggestedDistros.length ? (
              <ul>
                {migrationSummary.suggestedDistros.map((distro) => (
                  <li key={distro.id}>{distro.name}</li>
                ))}
              </ul>
            ) : (
              <p>
                {copy(
                  locale,
                  "No suitable distribution candidate is currently available.",
                  "Derzeit ist kein geeigneter Distributionskandidat verfügbar."
                )}
              </p>
            )}
          </article>

          <article className="migration-summary-actions">
            <h3>{copy(locale, "Next actions", "Nächste Schritte")}</h3>
            {migrationSummary.nextActions.length ? (
              <ol>
                {migrationSummary.nextActions.map((item) => (
                  <li key={item.en}>{localize(item, locale)}</li>
                ))}
              </ol>
            ) : (
              <p>
                {copy(
                  locale,
                  "No additional action is currently derived.",
                  "Derzeit wird kein zusätzlicher Schritt abgeleitet."
                )}
              </p>
            )}
          </article>
        </div>
      </section>

      <div className="passport-grid passport-grid-v3">
        <article className="passport-card passport-primary">
          <span>{t(locale, "primary")}</span>
          <h2>{selected?.distro.name ?? copy(locale, "Not selected", "Nicht ausgewählt")}</h2>
          <p>{selected ? t(locale, selected.tier) : copy(locale, "Not selected", "Nicht ausgewählt")}</p>
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
          <small>
            {unresolvedHardware.length} UNKNOWN · {passport.hardware.gpuVendor.toUpperCase()} · {hardwareSnapshot
              ? copy(locale, `${hardwareSnapshot.snapshot.facts.length} snapshot fact(s)`, `${hardwareSnapshot.snapshot.facts.length} Snapshot-Fakt(en)`)
              : copy(locale, "no snapshot", "kein Snapshot")}
          </small>
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
          <p>{passport.answers.gameLaunchers.join(" · ") || copy(locale, "None selected", "Keine ausgewählt")}</p>
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

        <details open={hardwareSnapshot !== null}>
          <summary>{copy(locale, "Hardware snapshot provenance", "Herkunft des Hardware-Snapshots")}</summary>
          {hardwareSnapshot ? (
            <>
              <p>
                {copy(locale, "Acquisition", "Übernahme")}: {hardwareSnapshot.acquisition === "browser_runtime"
                  ? copy(locale, "created in this browser", "in diesem Browser erstellt")
                  : copy(locale, "validated file import", "validierter Dateiimport")} · {copy(locale, "Claimed source", "Angegebene Quelle")}: {snapshotSourceText(hardwareSnapshot.snapshot.source, locale)} · {hardwareSnapshot.snapshot.collector.id} {hardwareSnapshot.snapshot.collector.version}
              </p>
              <p>
                {copy(
                  locale,
                  "Detected facts remain factual provenance only. Linux support requires a separate live test.",
                  "Erkannte Fakten bleiben ausschließlich sachliche Herkunftsangaben. Linux-Unterstützung erfordert einen getrennten Live-Test."
                )}
              </p>
              {hardwareSnapshot.snapshot.facts.length ? (
                <ul>
                  {hardwareSnapshot.snapshot.facts.map((fact, index) => (
                    <li key={`${fact.category}-${fact.name}-${index}`}>
                      <strong>{snapshotCategoryText(fact.category, locale)}</strong>
                      <span>{fact.vendor ? `${fact.vendor} · ` : ""}{fact.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{copy(locale, "This limited browser snapshot contains no device identity.", "Dieser begrenzte Browser-Snapshot enthält keine Geräteidentität.")}</p>
              )}
            </>
          ) : (
            <p>{copy(locale, "No hardware snapshot is stored. Manual evidence remains fully supported.", "Es ist kein Hardware-Snapshot gespeichert. Manuelle Evidenz bleibt vollständig unterstützt.")}</p>
          )}
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
        <p>{copy(locale, "This is the complete local Passport. An optional snapshot can contain selected hardware model names and non-unique PCI/USB IDs, but never accounts, serial numbers, network identifiers or uploaded user files. Do not put passwords or private keys in notes.", "Dies ist der vollständige lokale Passport. Ein optionaler Snapshot kann ausgewählte Hardware-Modellnamen und nicht eindeutige PCI-/USB-IDs enthalten, aber niemals Konten, Seriennummern, Netzwerkkennungen oder hochgeladene Benutzerdateien. Keine Passwörter oder privaten Schlüssel in Notizen eintragen.")}</p>
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

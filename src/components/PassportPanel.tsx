import { useRef, useState } from "react";
import type {
  DistroRecommendation,
  LiveReadiness,
  Locale,
  MigrationPassport,
  SoftwareAssessment
} from "../domain/types";
import { parsePassportText, serializePassport } from "../passport/schema";
import { t } from "../i18n";

interface PassportPanelProps {
  locale: Locale;
  passport: MigrationPassport;
  recommendations: DistroRecommendation[];
  softwareAssessment: SoftwareAssessment;
  liveReadiness: LiveReadiness;
  onImport: (passport: MigrationPassport) => void;
  onClear: () => void;
  onContinue: () => void;
}

type ImportState = "idle" | "success" | "error";

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

export function PassportPanel({
  locale,
  passport,
  recommendations,
  softwareAssessment,
  liveReadiness,
  onImport,
  onClear,
  onContinue
}: PassportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>("idle");
  const selected =
    recommendations.find((item) => item.distro.id === passport.selectedDistroId) ??
    recommendations[0];
  const also = recommendations.filter((item) => item.distro.id !== selected?.distro.id).slice(0, 2);

  const exportPassport = () => {
    const text = serializePassport(passport);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `migration-passport-${new Date().toISOString().slice(0, 10)}.json`;
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

  const blockerText = softwareAssessment.blockers.length
    ? softwareAssessment.blockers.map((item) => item.record.name).join(", ")
    : liveReadiness === "blocked"
      ? copy(locale, "Hardware function failed in live test", "Hardwarefunktion im Live-Test fehlgeschlagen")
      : t(locale, "noBlocker");

  const nextStep = softwareAssessment.blockers.length
    ? copy(locale, "Keep Windows and prove a replacement workflow with representative files or projects.", "Windows behalten und einen Ersatzablauf mit repräsentativen Dateien oder Projekten nachweisen.")
    : liveReadiness === "blocked"
      ? copy(locale, "Keep Windows available; resolve and re-test the failed hardware function.", "Windows verfügbar halten; ausgefallene Hardwarefunktion klären und erneut testen.")
      : liveReadiness === "incomplete"
        ? copy(locale, "Boot the live environment and complete every relevant hardware test.", "Live-System starten und jeden relevanten Hardwaretest abschließen.")
        : copy(locale, "Review official installation guidance and keep a tested backup and recovery path.", "Offizielle Installationsanleitung prüfen und ein getestetes Backup samt Wiederherstellungsweg bereithalten.");

  return (
    <section aria-labelledby="passport-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">06 / LOCAL EVIDENCE</p>
          <h1 id="passport-title">{t(locale, "passportTitle")}</h1>
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
            onChange={(event) => void importPassport(event.target.files?.[0])}
          />
        </div>
      </div>

      {importState !== "idle" ? (
        <div className={`notice ${importState === "success" ? "notice-info" : "notice-blocker"}`} role="status">
          <strong>{importState === "success" ? t(locale, "importSuccess") : t(locale, "importError")}</strong>
          {importState === "error" ? (
            <p>{copy(locale, "Only strict schema-version 1 files up to 256 KiB are accepted. Extra fields are rejected.", "Nur strikte Dateien der Schema-Version 1 bis 256 KiB werden akzeptiert. Zusätzliche Felder werden abgewiesen.")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="passport-grid">
        <article className="passport-card passport-primary">
          <span>{t(locale, "primary")}</span>
          <h2>{selected?.distro.name ?? copy(locale, "Not selected", "Nicht ausgewählt")}</h2>
          <p>{selected ? t(locale, selected.tier) : "—"}</p>
          {also.length ? (
            <div>
              <small>{t(locale, "alsoConsider")}</small>
              <strong>{also.map((item) => item.distro.name).join(" · ")}</strong>
            </div>
          ) : null}
        </article>

        <article className={`passport-card passport-${softwareAssessment.overall}`}>
          <span>{t(locale, "software")}</span>
          <h2>{softwareAssessment.items.length}</h2>
          <p>{softwareAssessment.overall.toUpperCase()}</p>
          <small>{softwareAssessment.blockers.length} {copy(locale, "blocker(s)", "Blocker")}</small>
        </article>

        <article className={`passport-card passport-${liveReadiness}`}>
          <span>{t(locale, "hardware")}</span>
          <h2>{passport.hardware.overall.replaceAll("_", " ").toUpperCase()}</h2>
          <p>LIVE: {liveReadiness.toUpperCase()}</p>
          <small>{passport.hardware.gpuVendor.toUpperCase()}</small>
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
          <span>{t(locale, "nextStep")}</span>
          <strong>{nextStep}</strong>
        </div>
      </div>

      <details className="json-preview">
        <summary>{copy(locale, "Inspect exported data", "Exportdaten ansehen")}</summary>
        <p>{copy(locale, "This is the complete data stored by the Alpha. It contains no automatic device identifiers.", "Dies sind die vollständigen von der Alpha gespeicherten Daten. Automatische Gerätekennungen sind nicht enthalten.")}</p>
        <pre>{serializePassport(passport)}</pre>
      </details>

      <div className="panel-actions">
        <button
          type="button"
          className="button danger"
          onClick={() => {
            if (window.confirm(copy(locale, "Reset all local migration data?", "Alle lokalen Migrationsdaten zurücksetzen?"))) {
              onClear();
              setImportState("idle");
            }
          }}
        >
          {t(locale, "clear")}
        </button>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Build first-boot plan", "Plan für den ersten Start erstellen")}
        </button>
      </div>
    </section>
  );
}

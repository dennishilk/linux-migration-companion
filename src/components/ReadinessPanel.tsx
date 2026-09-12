import type {
  Locale,
  MigrationPassport,
  ReadinessAssessment,
  SoftwareAssessment
} from "../domain/types";
import { localize } from "../i18n";

interface ReadinessPanelProps {
  locale: Locale;
  passport: MigrationPassport;
  readiness: ReadinessAssessment;
  software: SoftwareAssessment;
  onContinue: () => void;
}

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const stateLabels: Record<ReadinessAssessment["state"], { en: string; de: string }> = {
  ready: { en: "READY", de: "BEREIT" },
  ready_with_checks: { en: "READY WITH CHECKS", de: "BEREIT MIT PRÜFUNGEN" },
  live_test_required: { en: "LIVE TEST REQUIRED", de: "LIVE-TEST ERFORDERLICH" },
  windows_should_be_retained: { en: "WINDOWS SHOULD BE RETAINED", de: "WINDOWS SOLLTE BEHALTEN WERDEN" },
  blocked: { en: "BLOCKED", de: "BLOCKIERT" },
  insufficient_evidence: { en: "INSUFFICIENT EVIDENCE", de: "UNZUREICHENDE EVIDENZ" }
};

const strategyLabels: Record<ReadinessAssessment["strategy"], { en: string; de: string }> = {
  linux_primary: { en: "Linux appears suitable as the primary OS", de: "Linux erscheint als primäres Betriebssystem geeignet" },
  test_first: { en: "Test Linux first", de: "Linux zuerst testen" },
  dual_boot: { en: "Dual boot is a sensible strategy", de: "Dual Boot ist eine sinnvolle Strategie" },
  keep_windows_temporarily: { en: "Keep Windows temporarily", de: "Windows vorerst behalten" },
  keep_windows_for_workflows: { en: "Keep Windows for specific workflows", de: "Windows für bestimmte Arbeitsabläufe behalten" },
  migration_blocked: { en: "Migration is currently blocked", de: "Migration ist derzeit blockiert" }
};

export function ReadinessPanel({
  locale,
  passport,
  readiness,
  software,
  onContinue
}: ReadinessPanelProps) {
  const unknownRequired = Object.values(passport.hardware.evidence).filter(
    (item) => item.required && ["unknown", "known_fact", "user_reported"].includes(item.state)
  ).length;

  return (
    <section aria-labelledby="readiness-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">06 / MIGRATION READINESS</p>
          <h1 id="readiness-title">
            {copy(locale, "Can Windows safely stop being the proven path?", "Kann Windows sicher aufhören, der bewährte Weg zu sein?")}
          </h1>
          <p>{copy(locale, "Hard blockers outrank preferences and distro scores. The result below is derived from the evidence you recorded and explains itself.", "Harte Blocker stehen über Vorlieben und Distro-Scores. Das Ergebnis unten wird aus deiner erfassten Evidenz abgeleitet – und erklärt sich selbst.")}</p>
        </div>
        <div className={`readiness-hero readiness-state-${readiness.state}`} role="status">
          <span>{copy(locale, "Current state", "Aktueller Status")}</span>
          <strong>{stateLabels[readiness.state][locale]}</strong>
        </div>
      </div>

      <article className="strategy-card">
        <span>{copy(locale, "Should I keep Windows?", "Soll ich Windows behalten?")}</span>
        <h2>{strategyLabels[readiness.strategy][locale]}</h2>
        <p>{copy(locale, "The Companion never partitions disks, changes bootloaders or erases Windows. This is an evidence-based planning recommendation only.", "Der Companion partitioniert keine Datenträger, verändert keine Bootloader und löscht Windows nicht. Dies ist ausschließlich eine evidenzbasierte Planungsempfehlung.")}</p>
      </article>

      <div className="readiness-facts">
        <article>
          <strong>{software.blockers.length}</strong>
          <span>{copy(locale, "hard software blockers", "harte Software-Blocker")}</span>
        </article>
        <article>
          <strong>{unknownRequired}</strong>
          <span>{copy(locale, "required hardware UNKNOWN", "benötigte Hardware UNBEKANNT")}</span>
        </article>
        <article>
          <strong>{Object.values(passport.liveTests).filter((value) => value === "issue").length}</strong>
          <span>{copy(locale, "failed live checks", "problematische Live-Tests")}</span>
        </article>
      </div>

      <section className="readiness-gate" aria-labelledby="current-gate-title">
        <h2 id="current-gate-title">
          {copy(locale, "What currently decides this status?", "Was entscheidet diesen Status gerade?")}
        </h2>
        <p>{localize(readiness.currentGate.decidingFactor, locale)}</p>
        {readiness.currentGate.nextAction ? (
          <div>
            <h3>{copy(locale, "What could change it?", "Was könnte ihn ändern?")}</h3>
            <p>{localize(readiness.currentGate.nextAction, locale)}</p>
          </div>
        ) : null}
      </section>

      {readiness.blockers.length ? (
        <section className="readiness-reasons readiness-blockers" aria-labelledby="blockers-title">
          <h2 id="blockers-title">{copy(locale, "Why this is blocked", "Warum dies blockiert ist")}</h2>
          <ul>
            {readiness.blockers.map((item, index) => (
              <li key={`${item.en}-${index}`}>{localize(item, locale)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {readiness.reasons.length ? (
        <section className="readiness-reasons" aria-labelledby="reasons-title">
          <h2 id="reasons-title">{copy(locale, "Why this state was reached", "Warum dieser Status erreicht wurde")}</h2>
          <ul>
            {readiness.reasons.map((item, index) => (
              <li key={`${item.en}-${index}`}>{localize(item, locale)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {readiness.checks.length ? (
        <section className="readiness-reasons readiness-checks" aria-labelledby="checks-title">
          <h2 id="checks-title">{copy(locale, "Evidence still required", "Noch benötigte Evidenz")}</h2>
          <ul>
            {readiness.checks.map((item, index) => (
              <li key={`${item.en}-${index}`}>{localize(item, locale)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="notice notice-info">
        <strong>{copy(locale, "Safety rule", "Sicherheitsregel")}</strong>
        <p>{copy(locale, "Back up first. Test real hardware. Keep Windows until every important workflow is verified. UNKNOWN is better than a false green checkmark.", "Zuerst sichern. Echte Hardware testen. Windows behalten, bis jeder wichtige Arbeitsablauf verifiziert ist. UNBEKANNT ist besser als ein falscher grüner Haken.")}</p>
      </div>

      <div className="panel-actions sticky-actions">
        <span>{stateLabels[readiness.state][locale]}</span>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Plan my data migration", "Meine Datenmigration planen")}
        </button>
      </div>
    </section>
  );
}

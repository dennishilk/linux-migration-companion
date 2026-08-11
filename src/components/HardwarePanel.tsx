import { hardwareClasses } from "../data/hardware";
import type {
  GpuVendor,
  HardwareClassId,
  HardwareEvidenceState,
  HardwareProfile,
  LiveTestResults,
  Locale
} from "../domain/types";
import { applyHardwareSnapshot, factsForHardwareClass } from "../hardware/integration";
import { localize, t } from "../i18n";
import { HardwareSnapshotPanel } from "./HardwareSnapshotPanel";

interface HardwarePanelProps {
  locale: Locale;
  hardware: HardwareProfile;
  liveTests: LiveTestResults;
  onChange: (hardware: HardwareProfile) => void;
  onContinue: () => void;
}

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const gpuLabels: Record<GpuVendor, string> = {
  unknown: "UNKNOWN",
  nvidia: "NVIDIA",
  amd: "AMD",
  intel: "Intel"
};

const evidenceLabels: Record<
  HardwareEvidenceState,
  { en: string; de: string }
> = {
  unknown: { en: "UNKNOWN — not verified", de: "UNBEKANNT — nicht geprüft" },
  known_fact: { en: "Known fact — function not proven", de: "Bekannter Fakt — Funktion nicht bewiesen" },
  user_reported: { en: "User-reported — not independently verified", de: "Nutzerangabe — nicht unabhängig geprüft" },
  live_verified: { en: "Verified in a live session", de: "In einer Live-Sitzung verifiziert" },
  failed_test: { en: "Failed a live test", de: "Live-Test fehlgeschlagen" },
  known_issue: { en: "Known issue", de: "Bekanntes Problem" },
  not_applicable: { en: "Not applicable", de: "Nicht relevant" }
};

const evidenceStates = Object.keys(evidenceLabels) as HardwareEvidenceState[];

export function HardwarePanel({
  locale,
  hardware,
  liveTests,
  onChange,
  onContinue
}: HardwarePanelProps) {
  const setEvidence = (
    id: HardwareClassId,
    change: Partial<HardwareProfile["evidence"][HardwareClassId]>
  ) => {
    onChange({
      ...hardware,
      evidence: {
        ...hardware.evidence,
        [id]: { ...hardware.evidence[id], ...change }
      }
    });
  };

  const required = hardwareClasses.filter(
    ({ id }) => hardware.evidence[id].required
  );
  const unresolved = required.filter(({ id }) =>
    ["unknown", "known_fact", "user_reported"].includes(
      hardware.evidence[id].state
    )
  );
  const failed = required.filter(({ id }) =>
    ["failed_test", "known_issue"].includes(hardware.evidence[id].state)
  );

  return (
    <section aria-labelledby="hardware-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">04 / HARDWARE EVIDENCE</p>
          <h1 id="hardware-title">
            {copy(
              locale,
              "Record what is known—and leave the rest UNKNOWN",
              "Bekanntes erfassen – und den Rest UNBEKANNT lassen"
            )}
          </h1>
          <p>
            {copy(
              locale,
              "Choose manual evidence, a deliberately limited browser report, or a validated collector snapshot. A detected name never becomes a compatibility claim.",
              "Wähle manuelle Evidenz, einen bewusst begrenzten Browserbericht oder einen validierten Collector-Snapshot. Ein erkannter Name wird niemals zur Kompatibilitätsbehauptung."
            )}
          </p>
        </div>
        <div className="evidence-summary" aria-live="polite">
          <strong>{required.length} {copy(locale, "required", "benötigt")}</strong>
          <span>{unresolved.length} UNKNOWN · {failed.length} {copy(locale, "failed", "problematisch")}</span>
        </div>
      </div>

      <HardwareSnapshotPanel
        locale={locale}
        record={hardware.snapshot}
        onSnapshot={(record) => onChange(applyHardwareSnapshot(hardware, record))}
      />

      <div className="manual-hardware-card hardware-basics">
        <h2>{copy(locale, "Graphics context", "Grafikkontext")}</h2>
        <fieldset>
          <legend>{copy(locale, "Graphics vendor", "Grafikanbieter")}</legend>
          <div className="segmented-control">
            {(Object.keys(gpuLabels) as GpuVendor[]).map((vendor) => (
              <button
                type="button"
                key={vendor}
                className={hardware.gpuVendor === vendor ? "active" : ""}
                aria-pressed={hardware.gpuVendor === vendor}
                onClick={() => onChange({ ...hardware, gpuVendor: vendor })}
              >
                {gpuLabels[vendor]}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="field-help">
          {copy(
            locale,
            "This records a manufacturer only. Use the Graphics evidence card below to record actual test evidence.",
            "Dies erfasst nur einen Hersteller. Tatsächliche Testergebnisse gehören in die Grafikkarten-Evidenz unten."
          )}
        </p>
      </div>

      {hardware.gpuVendor === "nvidia" ? (
        <article className="notice notice-info nvidia-note">
          <strong>{t(locale, "nvidiaTitle")}</strong>
          <p>{t(locale, "nvidiaBody")}</p>
        </article>
      ) : null}

      <div className="hardware-evidence-grid">
        {hardwareClasses.map((definition) => {
          const evidence = hardware.evidence[definition.id];
          const detectedFacts = factsForHardwareClass(
            hardware.snapshot,
            definition.id
          );
          const detectedDisplayCount =
            definition.id === "external_monitors" &&
            (hardware.snapshot?.snapshot.system.connectedDisplays ?? 0) > 1
              ? hardware.snapshot?.snapshot.system.connectedDisplays
              : undefined;
          const liveStatus = definition.liveTestId
            ? liveTests[definition.liveTestId]
            : null;
          return (
            <article
              className={`hardware-evidence-card evidence-${evidence.state}`}
              key={definition.id}
            >
              <header>
                <div>
                  <h2>{localize(definition.title, locale)}</h2>
                  <p>{localize(definition.description, locale)}</p>
                </div>
                <label className="required-toggle">
                  <input
                    type="checkbox"
                    checked={evidence.required}
                    onChange={(event) =>
                      setEvidence(definition.id, {
                        required: event.target.checked,
                        state:
                          event.target.checked && evidence.state === "not_applicable"
                            ? "unknown"
                            : evidence.state
                      })
                    }
                  />
                  <span>{copy(locale, "Required", "Benötigt")}</span>
                </label>
              </header>

              {detectedFacts.length || detectedDisplayCount ? (
                <div className="snapshot-detected-facts">
                  <strong>
                    {copy(locale, "SNAPSHOT DETECTED", "SNAPSHOT ERKANNT")}
                  </strong>
                  <ul>
                    {detectedFacts.map((fact, index) => (
                      <li key={`${fact.name}-${index}`}>
                        {fact.vendor ? `${fact.vendor} · ` : ""}{fact.name}
                      </li>
                    ))}
                    {detectedDisplayCount ? (
                      <li>
                        {copy(
                          locale,
                          `${detectedDisplayCount} connected displays reported`,
                          `${detectedDisplayCount} verbundene Bildschirme gemeldet`
                        )}
                      </li>
                    ) : null}
                  </ul>
                  <span>
                    {liveStatus
                      ? `${copy(locale, "Live test", "Live-Test")}: ${t(locale, liveStatus)}`
                      : copy(
                          locale,
                          "No linked automatic live result; verify deliberately.",
                          "Kein verknüpftes automatisches Live-Ergebnis; bewusst prüfen."
                        )}
                  </span>
                </div>
              ) : null}

              <label className="stacked-field">
                <span>{t(locale, "evidenceState")}</span>
                <select
                  value={evidence.state}
                  onChange={(event) =>
                    setEvidence(definition.id, {
                      state: event.target.value as HardwareEvidenceState,
                      required:
                        event.target.value === "not_applicable"
                          ? false
                          : evidence.required
                    })
                  }
                >
                  {evidenceStates.map((state) => (
                    <option value={state} key={state}>
                      {evidenceLabels[state][locale]}
                    </option>
                  ))}
                </select>
              </label>

              {detectedFacts.length || detectedDisplayCount ? (
                <small className="snapshot-manual-override">
                  {copy(
                    locale,
                    "Manual state/details may correct the assessment; the original detected fact remains visible in the current snapshot.",
                    "Manueller Status und Details können die Bewertung korrigieren; der ursprünglich erkannte Fakt bleibt im aktuellen Snapshot sichtbar."
                  )}
                </small>
              ) : null}

              <label className="stacked-field">
                <span>{copy(locale, "Manual evidence details", "Manuelle Evidenzdetails")}</span>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={evidence.details}
                  placeholder={copy(
                    locale,
                    "Exact model, tested function, failure symptom—no secrets.",
                    "Genaues Modell, geprüfte Funktion, Fehlersymptom – keine Geheimnisse."
                  )}
                  onChange={(event) =>
                    setEvidence(definition.id, { details: event.target.value })
                  }
                />
                <small>{evidence.details.length} / 500</small>
              </label>

              {definition.liveTestId ? (
                <small className="live-test-link">
                  {copy(
                    locale,
                    `Can be linked to the ${definition.liveTestId.replaceAll("_", " ")} live test.`,
                    `Kann mit dem Live-Test „${definition.liveTestId.replaceAll("_", " ")}“ verknüpft werden.`
                  )}
                </small>
              ) : (
                <small className="live-test-link">
                  {copy(locale, "Requires a deliberate manual test.", "Erfordert einen bewussten manuellen Test.")}
                </small>
              )}
            </article>
          );
        })}
      </div>

      <div className="manual-hardware-card">
        <label className="stacked-field">
          <span>{t(locale, "notes")}</span>
          <textarea
            maxLength={1000}
            rows={4}
            value={hardware.notes}
            placeholder={t(locale, "notesPlaceholder")}
            onChange={(event) =>
              onChange({ ...hardware, notes: event.target.value })
            }
          />
          <small>{hardware.notes.length} / 1000</small>
        </label>
      </div>

      <div className="evidence-boundary">
        <strong>{copy(locale, "Evidence rule", "Evidenzregel")}</strong>
        <p>
          {copy(
            locale,
            "Only a representative live test can move an essential function to LIVE VERIFIED. UNKNOWN is safer than a false green checkmark.",
            "Nur ein repräsentativer Live-Test kann eine wichtige Funktion auf LIVE VERIFIZIERT setzen. UNBEKANNT ist sicherer als ein falscher grüner Haken."
          )}
        </p>
      </div>

      <div className="panel-actions sticky-actions">
        <span>
          {failed.length
            ? copy(locale, "Required hardware has a recorded issue", "Benötigte Hardware hat ein erfasstes Problem")
            : unresolved.length
              ? copy(locale, "Required hardware still needs live evidence", "Benötigte Hardware braucht noch Live-Evidenz")
              : copy(locale, "Required hardware evidence recorded", "Evidenz für benötigte Hardware erfasst")}
        </span>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Start live-test checklist", "Live-Test-Checkliste starten")}
        </button>
      </div>
    </section>
  );
}

import type {
  GpuVendor,
  HardwareEvidenceState,
  HardwareProfile,
  Locale
} from "../domain/types";
import { t } from "../i18n";

interface HardwarePanelProps {
  locale: Locale;
  hardware: HardwareProfile;
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
  verified: { en: "Verified on this machine", de: "Auf diesem Rechner verifiziert" },
  probably_supported: { en: "Probably supported", de: "Wahrscheinlich unterstützt" },
  unknown: { en: "UNKNOWN — needs live test", de: "UNBEKANNT — Live-Test nötig" },
  known_issue: { en: "Known issue", de: "Bekanntes Problem" },
  proprietary_driver_required: {
    en: "Proprietary driver likely required",
    de: "Proprietärer Treiber wahrscheinlich nötig"
  }
};

export function HardwarePanel({
  locale,
  hardware,
  onChange,
  onContinue
}: HardwarePanelProps) {
  const setGpu = (gpuVendor: GpuVendor) => {
    onChange({
      ...hardware,
      gpuVendor,
      overall:
        gpuVendor === "nvidia"
          ? "proprietary_driver_required"
          : hardware.overall === "proprietary_driver_required"
            ? "unknown"
            : hardware.overall
    });
  };

  return (
    <section aria-labelledby="hardware-title">
      <div className="page-heading">
        <p className="eyebrow">03 / HARDWARE EVIDENCE</p>
        <h1 id="hardware-title">
          {copy(locale, "Record facts; do not guess compatibility", "Fakten erfassen, Kompatibilität nicht raten")}
        </h1>
        <p>{t(locale, "scannerWhy")}</p>
      </div>

      <div className="hardware-layout">
        <article className="scanner-card">
          <div className="scanner-illustration" aria-hidden="true">
            <span>PCI / USB / SB</span>
            <strong>?</strong>
          </div>
          <div>
            <span className="tier tier-exploratory">DEFERRED IN ALPHA</span>
            <h2>{t(locale, "scannerDeferred")}</h2>
            <p>{t(locale, "scannerWhy")}</p>
            <p className="privacy-line">{t(locale, "neverCollected")}</p>
          </div>
        </article>

        <div className="manual-hardware-card">
          <h2>{copy(locale, "Manual evidence", "Manuelle Evidenz")}</h2>
          <fieldset>
            <legend>{copy(locale, "Graphics vendor", "Grafikanbieter")}</legend>
            <div className="segmented-control">
              {(Object.keys(gpuLabels) as GpuVendor[]).map((vendor) => (
                <button
                  type="button"
                  key={vendor}
                  className={hardware.gpuVendor === vendor ? "active" : ""}
                  aria-pressed={hardware.gpuVendor === vendor}
                  onClick={() => setGpu(vendor)}
                >
                  {gpuLabels[vendor]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="stacked-field">
            <span>{t(locale, "evidenceState")}</span>
            <select
              value={hardware.overall}
              onChange={(event) =>
                onChange({
                  ...hardware,
                  overall: event.target.value as HardwareEvidenceState
                })
              }
            >
              {(Object.keys(evidenceLabels) as HardwareEvidenceState[]).map((state) => (
                <option value={state} key={state}>{evidenceLabels[state][locale]}</option>
              ))}
            </select>
          </label>

          <label className="stacked-field">
            <span>{t(locale, "notes")}</span>
            <textarea
              maxLength={1000}
              rows={5}
              value={hardware.notes}
              placeholder={t(locale, "notesPlaceholder")}
              onChange={(event) => onChange({ ...hardware, notes: event.target.value })}
            />
            <small>{hardware.notes.length} / 1000</small>
          </label>
        </div>
      </div>

      {hardware.gpuVendor === "nvidia" ? (
        <article className="notice notice-info nvidia-note">
          <strong>{t(locale, "nvidiaTitle")}</strong>
          <p>{t(locale, "nvidiaBody")}</p>
        </article>
      ) : null}

      <div className="evidence-boundary">
        <strong>{copy(locale, "Evidence rule", "Evidenzregel")}</strong>
        <p>
          {copy(
            locale,
            "Only a representative live test can move an essential function from UNKNOWN to verified. A product name or loaded driver is not sufficient.",
            "Nur ein repräsentativer Live-Test kann eine wichtige Funktion von UNBEKANNT zu verifiziert verschieben. Produktname oder geladener Treiber reichen nicht."
          )}
        </p>
      </div>

      <div className="panel-actions">
        <span className={`hardware-state state-${hardware.overall}`}>{evidenceLabels[hardware.overall][locale]}</span>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Start live-test checklist", "Live-Test-Checkliste starten")}
        </button>
      </div>
    </section>
  );
}

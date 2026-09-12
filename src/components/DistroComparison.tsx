import { distroComparisonById } from "../data/distroComparison";
import { distros } from "../data/distros";
import type {
  DistroRecommendation,
  Locale
} from "../domain/types";
import { localize } from "../i18n";
import { buildCatalogReportUrl } from "../utils/catalogReport";

interface DistroComparisonProps {
  locale: Locale;
  recommendations: DistroRecommendation[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onContinue: () => void;
}

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const releaseLabels = {
  lts: { en: "Long-term support", de: "Langzeitunterstützung" },
  stable: { en: "Stable release", de: "Stabile Veröffentlichung" },
  rapid: { en: "Frequent releases", de: "Häufige Veröffentlichungen" },
  rolling: { en: "Rolling release", de: "Rolling Release" }
} as const;

export function DistroComparison({
  locale,
  recommendations,
  selectedIds,
  onChange,
  onContinue
}: DistroComparisonProps) {
  const selected = selectedIds
    .map((id) => distros.find((distro) => distro.id === id))
    .filter((distro) => distro !== undefined);
  const rankById = new Map(
    recommendations.map((item, index) => [item.distro.id, index + 1])
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else if (selectedIds.length < 3) {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <section aria-labelledby="compare-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">02 / COMPARE REAL TRADE-OFFS</p>
          <h1 id="compare-title">
            {copy(locale, "Compare up to three relevant distributions", "Bis zu drei relevante Distributionen vergleichen")}
          </h1>
          <p>
            {copy(
              locale,
              "The Companion compares a curated set of maintained profiles rather than every Linux distribution. It focuses on migration, maintenance and recovery differences that change a real decision.",
              "Der Companion vergleicht eine kuratierte Auswahl gepflegter Profile statt jeder existierenden Linux-Distribution. Im Mittelpunkt stehen Migrations-, Wartungs- und Recovery-Unterschiede, die eine echte Entscheidung verändern."
            )}
          </p>
        </div>
        <div className="comparison-count" aria-live="polite">
          <strong>{selectedIds.length} / 3</strong>
          <span>{copy(locale, "selected", "ausgewählt")}</span>
        </div>
      </div>

      <fieldset className="comparison-picker">
        <legend>{copy(locale, "Choose comparison set", "Vergleichsauswahl treffen")}</legend>
        <div>
          {distros.map((distro) => {
            const checked = selectedIds.includes(distro.id);
            const rank = rankById.get(distro.id);
            return (
              <label key={distro.id} className={checked ? "selected" : ""}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selectedIds.length >= 3}
                  onChange={() => toggle(distro.id)}
                />
                <span>
                  <strong>{distro.name}</strong>
                  <small>
                    {rank
                      ? copy(locale, `Advisor rank ${rank}`, `Advisor-Rang ${rank}`)
                      : distro.category.toUpperCase()}
                  </small>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {!selected.length ? (
        <div className="notice notice-info" role="status">
          <strong>{copy(locale, "No comparison selected", "Kein Vergleich ausgewählt")}</strong>
          <p>{copy(locale, "Choose one to three distributions above. UNKNOWN is better than filling space with assumptions.", "Oben eine bis drei Distributionen wählen. UNBEKANNT ist besser als mit Annahmen gefüllter Platz.")}</p>
        </div>
      ) : (
        <div className={`comparison-grid comparison-${selected.length}`}>
          {selected.map((distro) => {
            const comparison = distroComparisonById[distro.id];
            return (
              <article className="comparison-card" key={distro.id}>
                <header>
                  <span>{distro.category.toUpperCase()}</span>
                  <h2>{distro.name}</h2>
                  <p>{distro.edition ?? copy(locale, "User assembled", "Selbst zusammengestellt")}</p>
                </header>
                <dl>
                  <div>
                    <dt>{copy(locale, "Release model", "Release-Modell")}</dt>
                    <dd>{releaseLabels[distro.releaseModel][locale]}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Desktop", "Desktop")}</dt>
                    <dd>{localize(distro.desktop, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Maintenance", "Wartung")}</dt>
                    <dd>{localize(distro.maintenance, locale)}</dd>
                  </div>
                  <div>
                    <dt>NVIDIA</dt>
                    <dd>{localize(comparison.nvidia, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Gaming", "Gaming")}</dt>
                    <dd>{localize(comparison.gaming, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Support ecosystem", "Support-Ökosystem")}</dt>
                    <dd>{localize(comparison.ecosystem, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Beginner suitability", "Einsteiger-Eignung")}</dt>
                    <dd>{localize(comparison.beginner, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Troubleshooting", "Fehlersuche")}</dt>
                    <dd>{localize(comparison.troubleshooting, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Installation", "Installation")}</dt>
                    <dd>{localize(comparison.installation, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "Recovery philosophy", "Recovery-Philosophie")}</dt>
                    <dd>{localize(comparison.recovery, locale)}</dd>
                  </div>
                </dl>
                <div className="catalog-links">
                  <a href={distro.officialHome} target="_blank" rel="noreferrer">
                    {copy(locale, "Official project site ↗", "Offizielle Projektseite ↗")}
                  </a>
                  <a
                    className="catalog-report-link"
                    href={buildCatalogReportUrl({
                      type: "Distro",
                      name: distro.edition
                        ? `${distro.name} — ${distro.edition}`
                        : distro.name,
                      id: distro.id,
                      reviewedAt: distro.reviewedAt,
                      sourceUrl: distro.officialHome
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${copy(
                      locale,
                      "Report outdated or incorrect information",
                      "Veraltete oder falsche Information melden"
                    )} (${copy(locale, "opens in a new tab", "öffnet in einem neuen Tab")})`}
                  >
                    {copy(
                      locale,
                      "Report outdated or incorrect information",
                      "Veraltete oder falsche Information melden"
                    )} ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="evidence-boundary">
        <strong>{copy(locale, "Specialist safeguards remain active", "Spezialisten-Schutzregeln bleiben aktiv")}</strong>
        <p>{copy(locale, "Comparison visibility never upgrades a specialist recommendation. Advanced and reference profiles still depend on experience, terminal comfort, troubleshooting, maintenance and genuine architectural preferences.", "Die Sichtbarkeit im Vergleich wertet eine Spezialistenempfehlung niemals auf. Fortgeschrittene und Referenzprofile hängen weiterhin von Erfahrung, Terminal-Sicherheit, Fehlersuche, Wartung und echten Architekturpräferenzen ab.")}</p>
      </div>

      <div className="panel-actions sticky-actions">
        <span>{copy(locale, "No compatibility percentage is calculated", "Es wird kein Kompatibilitätsprozentsatz berechnet")}</span>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Review software reality", "Software-Realität prüfen")}
        </button>
      </div>
    </section>
  );
}

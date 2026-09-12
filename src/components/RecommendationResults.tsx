import { useState } from "react";
import type {
  AdvisorAnswers,
  DistroRecommendation,
  Locale
} from "../domain/types";
import { buildAdvisorWarnings } from "../engine/recommend";
import { localize, t } from "../i18n";
import { buildCatalogReportUrl } from "../utils/catalogReport";

interface RecommendationResultsProps {
  locale: Locale;
  answers: AdvisorAnswers;
  recommendations: DistroRecommendation[];
  selectedDistroId: string | null;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onContinue: () => void;
}

const text = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

export function RecommendationResults({
  locale,
  answers,
  recommendations,
  selectedDistroId,
  onSelect,
  onEdit,
  onContinue
}: RecommendationResultsProps) {
  const [showAll, setShowAll] = useState(false);
  const warnings = buildAdvisorWarnings(answers);
  const visible = showAll ? recommendations : recommendations.slice(0, 4);

  return (
    <section aria-labelledby="results-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">01 / FIT ADVISOR / RESULT</p>
          <h1 id="results-title">{t(locale, "results")}</h1>
          <p>{t(locale, "noPercent")}</p>
        </div>
        <button type="button" className="button secondary" onClick={onEdit}>
          {text(locale, "Edit answers", "Antworten bearbeiten")}
        </button>
      </div>

      {warnings.length ? (
        <div className="notice-stack" aria-label={text(locale, "Fit warnings", "Eignungshinweise")}>
          {warnings.map((warning) => (
            <article
              className={`notice notice-${warning.severity}`}
              key={`${warning.severity}-${warning.title.en}`}
            >
              <strong>{localize(warning.title, locale)}</strong>
              <p>{localize(warning.detail, locale)}</p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="recommendation-list">
        {visible.map((item, index) => {
          const selected = selectedDistroId === item.distro.id;
          return (
            <article
              className={selected ? "recommendation-card selected" : "recommendation-card"}
              key={item.distro.id}
            >
              <header className="recommendation-header">
                <div className="rank" aria-label={`${text(locale, "Rank", "Rang")} ${index + 1}`}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <span className={`tier tier-${item.tier}`}>{t(locale, item.tier)}</span>
                  <h2>
                    {item.distro.name}
                    {item.distro.edition ? <small>{item.distro.edition}</small> : null}
                  </h2>
                  <p>{localize(item.distro.summary, locale)}</p>
                </div>
                <div className="support-depth">
                  <span>{text(locale, "Support depth", "Support-Tiefe")}</span>
                  <strong>{item.distro.supportDepth.toUpperCase()}</strong>
                </div>
              </header>

              <div className="result-columns">
                <div>
                  <h3>{t(locale, "whyFits")}</h3>
                  <ul>
                    {item.reasons.slice(0, 3).map((reason) => (
                      <li key={reason.en}>{localize(reason, locale)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>{t(locale, "tradeoffs")}</h3>
                  {item.tradeoffs.length ? (
                    <ul>
                      {item.tradeoffs.slice(0, 3).map((tradeoff) => (
                        <li key={tradeoff.en}>{localize(tradeoff, locale)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{text(locale, "No answer-specific trade-off was triggered.", "Kein antwortspezifischer Kompromiss wurde ausgelöst.")}</p>
                  )}
                </div>
              </div>

              <details className="explanation-details">
                <summary>{t(locale, "causedBy")}</summary>
                <ul>
                  {item.causedBy.map((cause) => (
                    <li key={cause.en}>{localize(cause, locale)}</li>
                  ))}
                </ul>
                <h3>{t(locale, "changeResult")}</h3>
                <ul>
                  {item.changeFactors.map((factor) => (
                    <li key={factor.en}>{localize(factor, locale)}</li>
                  ))}
                </ul>
              </details>

              <footer className="card-actions">
                <div className="catalog-links">
                  <a
                    className="text-link"
                    href={item.distro.officialHome}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {text(locale, "Official project", "Offizielles Projekt")} ↗
                  </a>
                  <a
                    className="catalog-report-link"
                    href={buildCatalogReportUrl({
                      type: "Distro",
                      name: item.distro.edition
                        ? `${item.distro.name} — ${item.distro.edition}`
                        : item.distro.name,
                      id: item.distro.id,
                      reviewedAt: item.distro.reviewedAt,
                      sourceUrl: item.distro.officialHome
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${text(
                      locale,
                      "Report outdated or incorrect information",
                      "Veraltete oder falsche Information melden"
                    )} (${text(locale, "opens in a new tab", "öffnet in einem neuen Tab")})`}
                  >
                    {text(
                      locale,
                      "Report outdated or incorrect information",
                      "Veraltete oder falsche Information melden"
                    )} ↗
                  </a>
                </div>
                <button
                  type="button"
                  className={selected ? "button success" : "button primary"}
                  onClick={() => onSelect(item.distro.id)}
                >
                  {selected ? t(locale, "chosen") : t(locale, "choose")}
                </button>
              </footer>
            </article>
          );
        })}
      </div>

      <div className="panel-actions result-actions">
        <button type="button" className="button secondary" onClick={() => setShowAll((value) => !value)}>
          {showAll
            ? text(locale, "Show top matches", "Nur Top-Empfehlungen zeigen")
            : text(locale, "Compare all included profiles", "Alle enthaltenen Profile vergleichen")}
        </button>
        <button type="button" className="button primary" onClick={onContinue}>
          {t(locale, "continueSoftware")}
        </button>
      </div>
    </section>
  );
}

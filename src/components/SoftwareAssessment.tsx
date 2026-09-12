import { useMemo, useState } from "react";
import { softwareCatalog, softwareCategories } from "../data/software";
import type {
  Locale,
  SoftwarePriority,
  SoftwareRecord,
  SoftwareRoute,
  SoftwareSelections
} from "../domain/types";
import { assessSoftware } from "../engine/assess";
import { localize, t } from "../i18n";
import { buildCatalogReportUrl } from "../utils/catalogReport";

interface SoftwareAssessmentProps {
  locale: Locale;
  selections: SoftwareSelections;
  onChange: (selections: SoftwareSelections) => void;
  onContinue: () => void;
}

const categoryText: Record<SoftwareRecord["category"], { en: string; de: string }> = {
  office: { en: "Office & files", de: "Office & Dateien" },
  creative: { en: "Creative", de: "Kreativ" },
  development: { en: "Development", de: "Entwicklung" },
  gaming: { en: "Gaming", de: "Gaming" },
  communication: { en: "Communication", de: "Kommunikation" },
  media: { en: "Media", de: "Medien" },
  professional: { en: "Professional", de: "Professionell" },
  hardware: { en: "Hardware utilities", de: "Hardware-Werkzeuge" },
  cloud: { en: "Cloud workflows", de: "Cloud-Arbeitsabläufe" },
  security: { en: "Security & recovery", de: "Sicherheit & Wiederherstellung" }
};

const routeText: Record<SoftwareRoute, { en: string; de: string }> = {
  native: { en: "Native Linux", de: "Nativ für Linux" },
  web_option: { en: "Web option", de: "Web-Option" },
  compatibility_layer: { en: "Compatibility layer", de: "Kompatibilitätsschicht" },
  alternative_workflow: { en: "Alternative workflow", de: "Alternativer Ablauf" },
  partial_replacement: { en: "Partial replacement", de: "Teilweiser Ersatz" },
  no_real_equivalent: { en: "No real equivalent", de: "Kein echter Ersatz" },
  manual_verification_required: { en: "Verify manually", de: "Manuell prüfen" }
};

const pick = (locale: Locale, value: { en: string; de: string }) => value[locale];

export function SoftwareAssessmentPanel({
  locale,
  selections,
  onChange,
  onContinue
}: SoftwareAssessmentProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SoftwareRecord["category"] | "all">("all");
  const assessment = useMemo(() => assessSoftware(selections), [selections]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return softwareCatalog.filter((software) => {
      const categoryMatches = category === "all" || software.category === category;
      const textMatches =
        !needle ||
        software.name.toLocaleLowerCase(locale).includes(needle) ||
        localize(software.summary, locale).toLocaleLowerCase(locale).includes(needle);
      return categoryMatches && textMatches;
    });
  }, [category, locale, query]);

  const setPriority = (id: string, priority: SoftwarePriority) => {
    onChange({ ...selections, [id]: priority });
  };

  const remove = (id: string) => {
    const next = { ...selections };
    delete next[id];
    onChange(next);
  };

  const statusText =
    assessment.overall === "blocked"
      ? t(locale, "softwareBlocked")
      : assessment.overall === "review"
        ? t(locale, "softwareReview")
        : t(locale, "softwareReady");

  return (
    <section aria-labelledby="software-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">03 / SOFTWARE REALITY</p>
          <h1 id="software-title">
            {locale === "de" ? "Welche Software muss wirklich mit?" : "What software genuinely has to move?"}
          </h1>
          <p>
            {locale === "de"
              ? "Wähle echte Pflicht-Abläufe. Eine Distributionsempfehlung kann keinen Software-Blocker überstimmen."
              : "Select real must-have workflows. A distro recommendation cannot override a software blocker."}
          </p>
        </div>
        <div className={`assessment-status status-${assessment.overall}`}>
          <strong>{assessment.items.length} {t(locale, "selectedCount")}</strong>
          <span>{statusText}</span>
        </div>
      </div>

      {assessment.blockers.length ? (
        <div className="notice notice-blocker" role="status">
          <strong>{t(locale, "blocker")}: {assessment.blockers.map((item) => item.record.name).join(", ")}</strong>
          <p>{locale === "de" ? "Windows behalten, bis ein repräsentativer Ersatzweg nachweislich funktioniert." : "Keep Windows until a representative replacement workflow is proven."}</p>
        </div>
      ) : null}

      <div className="software-toolbar">
        <label className="search-field">
          <span className="sr-only">{t(locale, "searchSoftware")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(locale, "searchSoftware")}
          />
        </label>
        <label>
          <span className="sr-only">{t(locale, "allCategories")}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
            <option value="all">{t(locale, "allCategories")}</option>
            {softwareCategories.map((item) => (
              <option value={item} key={item}>{pick(locale, categoryText[item])}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="catalog-count">
        {filtered.length} / {softwareCatalog.length} {locale === "de" ? "kuratierte Arbeitsabläufe" : "curated workflows"}
      </p>

      <div className="software-grid">
        {filtered.map((software) => {
          const priority = selections[software.id];
          const item = assessment.items.find((entry) => entry.record.id === software.id);
          return (
            <article className={priority ? "software-card selected" : "software-card"} key={software.id}>
              <header>
                <span>{pick(locale, categoryText[software.category])}</span>
                {item ? <strong className={`risk risk-${item.risk}`}>{item.risk.toUpperCase()}</strong> : null}
                <h2>{software.name}</h2>
              </header>
              <p>{localize(software.summary, locale)}</p>
              <div className="tag-row">
                <span className="classification-tag">
                  {software.scope === "application"
                    ? locale === "de" ? "Anwendung" : "Application"
                    : locale === "de" ? "Arbeitsablauf" : "Workflow"}
                </span>
                <span className={`freshness-tag freshness-${software.freshness}`}>
                  {software.freshness === "volatile"
                    ? locale === "de" ? "Volatil – erneut prüfen" : "Volatile: re-check"
                    : locale === "de" ? "Stabile Grundlage" : "Stable baseline"}
                </span>
                {software.routes.map((route) => <span key={route}>{pick(locale, routeText[route])}</span>)}
              </div>
              <details>
                <summary>{t(locale, "verifyWorkflow")}</summary>
                <p>{localize(software.verify, locale)}</p>
                <a href={software.sourceUrl} target="_blank" rel="noreferrer">
                  {software.sourceLabel} ↗
                </a>
                <small>{t(locale, "reviewed")}: {software.reviewedAt}</small>
                <a
                  className="catalog-report-link"
                  href={buildCatalogReportUrl({
                    type: "Software",
                    name: software.name,
                    id: software.id,
                    reviewedAt: software.reviewedAt,
                    sourceUrl: software.sourceUrl
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${
                    locale === "de"
                      ? "Veraltete oder falsche Information melden"
                      : "Report outdated or incorrect information"
                  } (${locale === "de" ? "öffnet in einem neuen Tab" : "opens in a new tab"})`}
                >
                  {locale === "de"
                    ? "Veraltete oder falsche Information melden"
                    : "Report outdated or incorrect information"} ↗
                </a>
              </details>
              <footer>
                {!priority ? (
                  <button type="button" className="button secondary compact" onClick={() => setPriority(software.id, "important")}>
                    {t(locale, "add")}
                  </button>
                ) : (
                  <>
                    <div className="priority-switch" role="group" aria-label={`${software.name} ${locale === "de" ? "Wichtigkeit" : "priority"}`}>
                      <button
                        type="button"
                        className={priority === "important" ? "active" : ""}
                        aria-pressed={priority === "important"}
                        onClick={() => setPriority(software.id, "important")}
                      >
                        {t(locale, "important")}
                      </button>
                      <button
                        type="button"
                        className={priority === "essential" ? "active" : ""}
                        aria-pressed={priority === "essential"}
                        onClick={() => setPriority(software.id, "essential")}
                      >
                        {t(locale, "essential")}
                      </button>
                    </div>
                    <button type="button" className="button ghost compact" onClick={() => remove(software.id)}>
                      {t(locale, "remove")}
                    </button>
                  </>
                )}
              </footer>
            </article>
          );
        })}
      </div>

      <div className="panel-actions sticky-actions">
        <span>{statusText}</span>
        <button type="button" className="button primary" onClick={onContinue}>
          {locale === "de" ? "Hardware erfassen" : "Record hardware"}
        </button>
      </div>
    </section>
  );
}

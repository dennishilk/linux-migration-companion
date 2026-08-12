import { liveTestDefinitions } from "../data/liveTests";
import type {
  LiveTestId,
  LiveTestResults,
  LiveTestStatus,
  Locale
} from "../domain/types";
import { assessLiveReadiness } from "../engine/assess";
import { localize, t } from "../i18n";

interface LiveTestPanelProps {
  locale: Locale;
  results: LiveTestResults;
  onChange: (results: LiveTestResults) => void;
  onContinue: () => void;
}

const statuses: LiveTestStatus[] = [
  "not_tested",
  "works",
  "issue",
  "not_applicable"
];

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

export function LiveTestPanel({
  locale,
  results,
  onChange,
  onContinue
}: LiveTestPanelProps) {
  const readiness = assessLiveReadiness(results);
  const complete = Object.values(results).filter((value) => value !== "not_tested").length;
  const readinessMessage =
    readiness === "ready"
      ? t(locale, "readinessReady")
      : readiness === "blocked"
        ? t(locale, "readinessBlocked")
        : t(locale, "readinessIncomplete");

  const setStatus = (id: LiveTestId, status: LiveTestStatus) => {
    onChange({ ...results, [id]: status });
  };

  return (
    <section aria-labelledby="live-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">05 / LIVE TEST ASSISTANT</p>
          <h1 id="live-title">{t(locale, "liveTitle")}</h1>
          <p>{t(locale, "liveLead")}</p>
        </div>
        <div className={`readiness-badge readiness-${readiness}`}>
          <strong>{complete} / {liveTestDefinitions.length}</strong>
          <span>{readinessMessage}</span>
        </div>
      </div>

      {readiness === "blocked" ? (
        <div className="notice notice-blocker" role="alert">
          <strong>{t(locale, "doNotRemove")}</strong>
          <p>{copy(locale, "Re-test after a supported update or driver path. Keep Windows available while an essential function fails.", "Nach unterstütztem Update- oder Treiberweg erneut testen. Windows behalten, solange eine wichtige Funktion ausfällt.")}</p>
        </div>
      ) : null}

      <div className="live-test-list">
        {liveTestDefinitions.map((test, index) => (
          <article className={`live-test-row live-${results[test.id]}`} key={test.id}>
            <div className="test-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="test-copy">
              <h2>{localize(test.title, locale)}</h2>
              <p>{localize(test.instruction, locale)}</p>
              {test.essential ? <span>{copy(locale, "CORE CHECK", "KERNCHECK")}</span> : null}
            </div>
            <div className="test-status" role="group" aria-label={`${localize(test.title, locale)} ${copy(locale, "status", "Status")}`}>
              {statuses.map((status) => (
                <button
                  type="button"
                  key={status}
                  className={results[test.id] === status ? "active" : ""}
                  aria-pressed={results[test.id] === status}
                  onClick={() => setStatus(test.id, status)}
                >
                  {t(locale, status)}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="panel-actions sticky-actions">
        <span>{readinessMessage}</span>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Review migration readiness", "Migrationsbereitschaft prüfen")}
        </button>
      </div>
    </section>
  );
}

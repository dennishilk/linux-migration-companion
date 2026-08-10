import { useMemo, useState } from "react";
import type { Locale, MigrationPassport } from "../domain/types";
import { buildFirstBootPlan } from "../engine/firstBoot";
import { localize, t } from "../i18n";

interface FirstBootPanelProps {
  locale: Locale;
  passport: MigrationPassport;
}

export function FirstBootPanel({ locale, passport }: FirstBootPanelProps) {
  const [explain, setExplain] = useState(false);
  const plan = useMemo(
    () =>
      buildFirstBootPlan(
        passport.selectedDistroId,
        passport.answers,
        passport.softwareSelections,
        passport.liveTests
      ),
    [passport]
  );

  return (
    <section aria-labelledby="first-boot-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">07 / FIRST BOOT PLAN</p>
          <h1 id="first-boot-title">{t(locale, "firstBootTitle")}</h1>
          <p>{t(locale, "noExecution")}</p>
        </div>
        <div className="mode-switch" role="group" aria-label={locale === "de" ? "Erklärmodus" : "Explanation mode"}>
          <button
            type="button"
            className={!explain ? "active" : ""}
            aria-pressed={!explain}
            onClick={() => setExplain(false)}
          >
            {t(locale, "guided")}
          </button>
          <button
            type="button"
            className={explain ? "active" : ""}
            aria-pressed={explain}
            onClick={() => setExplain(true)}
          >
            {t(locale, "explain")}
          </button>
        </div>
      </div>

      <div className="notice notice-info">
        <strong>{locale === "de" ? "Plan, kein Skript" : "Plan, not a script"}</strong>
        <p>{t(locale, "noExecution")}</p>
      </div>

      <ol className="first-boot-plan">
        {plan.map((step, index) => (
          <li key={step.id}>
            <div className="plan-index">{String(index + 1).padStart(2, "0")}</div>
            <article>
              <h2>{localize(step.title, locale)}</h2>
              <p>{localize(step.summary, locale)}</p>
              {explain ? (
                <div className="plan-explanation">
                  <strong>{t(locale, "why")}</strong>
                  <p>{localize(step.explanation, locale)}</p>
                  {step.caution ? (
                    <aside>
                      <strong>{t(locale, "safety")}</strong>
                      <p>{localize(step.caution, locale)}</p>
                    </aside>
                  ) : null}
                </div>
              ) : null}
            </article>
          </li>
        ))}
      </ol>

      <div className="completion-card">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>{locale === "de" ? "Der Plan bleibt lokal und unverbindlich" : "The plan stays local and non-executing"}</strong>
          <p>{locale === "de" ? "Vor jedem Schritt aktuelle offizielle Dokumentation der gewählten Distribution prüfen." : "Check the selected distribution's current official documentation before every step."}</p>
        </div>
      </div>
    </section>
  );
}

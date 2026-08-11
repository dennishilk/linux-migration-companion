import { useMemo, useState } from "react";
import type { Locale, MigrationPassport } from "../domain/types";
import { buildFirstBootPlan } from "../engine/firstBoot";
import { localize, t } from "../i18n";

interface FirstBootPanelProps {
  locale: Locale;
  passport: MigrationPassport;
}

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

export function FirstBootPanel({ locale, passport }: FirstBootPanelProps) {
  const [explain, setExplain] = useState(false);
  const plan = useMemo(() => buildFirstBootPlan(passport), [passport]);

  return (
    <section aria-labelledby="first-boot-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">10 / FIRST BOOT PLAN 2.0</p>
          <h1 id="first-boot-title">{t(locale, "firstBootTitle")}</h1>
          <p>{t(locale, "noExecution")}</p>
        </div>
        <div className="mode-switch" role="group" aria-label={copy(locale, "Explanation mode", "Erklärmodus")}>
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
        <strong>{copy(locale, "Plan, not a script", "Plan, kein Skript")}</strong>
        <p>{copy(locale, "No command is generated or executed. For volatile steps, re-check the selected distribution's current official documentation.", "Kein Befehl wird erzeugt oder ausgeführt. Bei volatilen Schritten aktuelle offizielle Dokumentation der gewählten Distribution erneut prüfen.")}</p>
      </div>

      <ol className="first-boot-plan first-boot-v2">
        {plan.map((item, index) => (
          <li key={item.id}>
            <div className="plan-index">{String(index + 1).padStart(2, "0")}</div>
            <article>
              <h2>{localize(item.title, locale)}</h2>
              <p>{localize(item.what, locale)}</p>
              {explain ? (
                <dl className="plan-explanation-grid">
                  <div>
                    <dt>{copy(locale, "WHAT?", "WAS?")}</dt>
                    <dd>{localize(item.what, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "WHY?", "WARUM?")}</dt>
                    <dd>{localize(item.why, locale)}</dd>
                  </div>
                  <div className="plan-risk">
                    <dt>{copy(locale, "RISK?", "RISIKO?")}</dt>
                    <dd>{localize(item.risk, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "VERIFY SUCCESS", "ERFOLG PRÜFEN")}</dt>
                    <dd>{localize(item.verify, locale)}</dd>
                  </div>
                  <div>
                    <dt>{copy(locale, "BACK OUT", "RÜCKWEG")}</dt>
                    <dd>{localize(item.backOut, locale)}</dd>
                  </div>
                </dl>
              ) : null}
            </article>
          </li>
        ))}
      </ol>

      <div className="completion-card">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>{copy(locale, "The plan stays local and non-executing", "Der Plan bleibt lokal und führt nichts aus")}</strong>
          <p>{copy(locale, "Back up first. Test real hardware. Keep Windows until important workflows are verified.", "Zuerst sichern. Echte Hardware testen. Windows behalten, bis wichtige Arbeitsabläufe verifiziert sind.")}</p>
        </div>
      </div>
    </section>
  );
}

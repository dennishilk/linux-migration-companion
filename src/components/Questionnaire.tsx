import { useState } from "react";
import {
  launcherOptions,
  launcherQuestion,
  questionGroups,
  questions
} from "../data/questions";
import type {
  AdvisorAnswers,
  GameLauncher,
  Locale
} from "../domain/types";
import { localize, t } from "../i18n";

const groups = [
  "starting_point",
  "confidence",
  "maintenance",
  "workflow",
  "hardware"
] as const;

interface QuestionnaireProps {
  locale: Locale;
  answers: AdvisorAnswers;
  onChange: (answers: AdvisorAnswers) => void;
  onAnalyze: () => void;
}

export function Questionnaire({
  locale,
  answers,
  onChange,
  onAnalyze
}: QuestionnaireProps) {
  const [groupIndex, setGroupIndex] = useState(0);
  const group = groups[groupIndex];
  const groupQuestions = questions.filter((question) => question.group === group);

  const setField = (
    field: Exclude<keyof AdvisorAnswers, "gameLaunchers">,
    value: string
  ) => {
    onChange({ ...answers, [field]: value });
  };

  const toggleLauncher = (launcher: GameLauncher) => {
    const selected = answers.gameLaunchers.includes(launcher);
    onChange({
      ...answers,
      gameLaunchers: selected
        ? answers.gameLaunchers.filter((item) => item !== launcher)
        : [...answers.gameLaunchers, launcher]
    });
  };

  return (
    <section aria-labelledby="advisor-title">
      <div className="page-heading">
        <p className="eyebrow">01 / FIT ADVISOR</p>
        <h1 id="advisor-title">{t(locale, "startTitle")}</h1>
        <p>{t(locale, "startLead")}</p>
      </div>

      <div className="question-progress" aria-label="Question groups">
        {groups.map((item, index) => (
          <button
            key={item}
            type="button"
            className={index === groupIndex ? "active" : ""}
            aria-current={index === groupIndex ? "step" : undefined}
            onClick={() => setGroupIndex(index)}
          >
            <span>{index + 1}</span>
            {localize(questionGroups[item], locale)}
          </button>
        ))}
      </div>

      <div className="question-panel">
        <div className="section-kicker">
          <span>
            {groupIndex + 1} / {groups.length}
          </span>
          <h2>{localize(questionGroups[group], locale)}</h2>
        </div>

        <div className="question-list">
          {groupQuestions.map((question) => (
            <fieldset className="question-card" key={question.field}>
              <legend>{localize(question.question, locale)}</legend>
              <p>{localize(question.help, locale)}</p>
              <div
                className={
                  question.options.length > 3
                    ? "option-grid option-grid-compact"
                    : "option-grid"
                }
              >
                {question.options.map((option) => {
                  const selected = answers[question.field] === option.value;
                  return (
                    <label
                      key={option.value}
                      className={selected ? "option-card selected" : "option-card"}
                    >
                      <input
                        type="radio"
                        name={question.field}
                        value={option.value}
                        checked={selected}
                        onChange={() => setField(question.field, option.value)}
                      />
                      <span>
                        <strong>{localize(option.label, locale)}</strong>
                        {option.description ? (
                          <small>{localize(option.description, locale)}</small>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {group === "workflow" && answers.gaming !== "none" ? (
            <fieldset className="question-card">
              <legend>{localize(launcherQuestion.question, locale)}</legend>
              <p>{localize(launcherQuestion.help, locale)}</p>
              <div className="check-grid">
                {launcherOptions.map((launcher) => (
                  <label
                    key={launcher.id}
                    className={
                      answers.gameLaunchers.includes(launcher.id)
                        ? "check-card selected"
                        : "check-card"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={answers.gameLaunchers.includes(launcher.id)}
                      onChange={() => toggleLauncher(launcher.id)}
                    />
                    <span>{launcher.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>

        <div className="panel-actions">
          <button
            type="button"
            className="button secondary"
            disabled={groupIndex === 0}
            onClick={() => setGroupIndex((index) => Math.max(0, index - 1))}
          >
            {t(locale, "previous")}
          </button>
          {groupIndex < groups.length - 1 ? (
            <button
              type="button"
              className="button primary"
              onClick={() =>
                setGroupIndex((index) => Math.min(groups.length - 1, index + 1))
              }
            >
              {t(locale, "next")}
            </button>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={onAnalyze}
            >
              {t(locale, "analyze")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

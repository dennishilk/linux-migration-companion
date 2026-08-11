import { useState } from "react";
import type { AppSection, Locale } from "../domain/types";
import { messages, sectionLabel, t } from "../i18n";
import { ResetDialog } from "./ResetDialog";

const sections: AppSection[] = [
  "advisor",
  "compare",
  "software",
  "hardware",
  "live",
  "readiness",
  "data",
  "media",
  "passport",
  "first_boot"
];

interface LayoutProps {
  locale: Locale;
  section: AppSection;
  onLocaleChange: (locale: Locale) => void;
  onSectionChange: (section: AppSection) => void;
  onReset: () => void;
  children: React.ReactNode;
}

export function Layout({
  locale,
  section,
  onLocaleChange,
  onSectionChange,
  onReset,
  children
}: LayoutProps) {
  const [resetOpen, setResetOpen] = useState(false);

  const confirmReset = () => {
    onReset();
    setResetOpen(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {locale === "de" ? "Zum Hauptinhalt springen" : "Skip to main content"}
      </a>
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => onSectionChange("advisor")}
          aria-label={t(locale, "appName")}
        >
          <svg
            className="brand-mark"
            viewBox="0 0 64 64"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="1" y="1" width="62" height="62" rx="13" />
            <path className="brand-path" d="M15 19c9 0 9 13 18 13h16" />
            <path className="brand-path" d="M15 45c9 0 9-13 18-13" />
            <circle className="brand-node" cx="15" cy="19" r="4" />
            <circle className="brand-node" cx="15" cy="45" r="4" />
            <path className="brand-arrow" d="m42 24 8 8-8 8" />
          </svg>
          <span>
            <strong>{t(locale, "appName")}</strong>
            <small>{t(locale, "releaseStatus")}</small>
          </span>
        </button>

        <div className="topbar-actions">
          <span className="local-only">
            <span className="status-dot" aria-hidden="true" />
            {t(locale, "localOnly")}
          </span>
          <button
            type="button"
            className="start-over-control"
            onClick={() => setResetOpen(true)}
          >
            {t(locale, "startOver")}
          </button>
          <div className="language-switch" role="group" aria-label={t(locale, "language")}>
            <button
              type="button"
              className={locale === "de" ? "active" : ""}
              aria-pressed={locale === "de"}
              onClick={() => onLocaleChange("de")}
            >
              DE
            </button>
            <button
              type="button"
              className={locale === "en" ? "active" : ""}
              aria-pressed={locale === "en"}
              onClick={() => onLocaleChange("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside
          className="side-nav"
          aria-label={locale === "de" ? "Migrationsweg" : "Migration journey"}
        >
          <div className="terminal-status" aria-hidden="true">
            <span>migration@nebunix:~$ analyze</span>
            <strong>LOCAL MODE</strong>
          </div>
          <nav>
            <ol>
              {sections.map((item, index) => (
                <li key={item}>
                  <button
                    type="button"
                    className={item === section ? "active" : ""}
                    aria-current={item === section ? "step" : undefined}
                    onClick={() => onSectionChange(item)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {sectionLabel(
                      locale,
                      item as keyof typeof messages.en.sections
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="boundary-note">
            <strong>SAFE RELEASE CANDIDATE</strong>
            <span>
              {locale === "de"
                ? "Keine Datenträger-Schreibzugriffe. Keine Befehlsausführung."
                : "No disk writes. No command execution."}
            </span>
          </div>
        </aside>

        <main id="main-content" className="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      <footer className="footer">
        <div className="footer-safety">
          <span>{t(locale, "privacyFooter")}</span>
          <span>{t(locale, "notAffiliated")}</span>
        </div>
        <div className="footer-attribution" aria-label="Authorship and license">
          <span>© 2026 Dennis Hilk</span>
          <span>Linux Migration Companion</span>
          <span>Licensed under the MIT License</span>
        </div>
      </footer>

      <ResetDialog
        locale={locale}
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={confirmReset}
      />
    </div>
  );
}

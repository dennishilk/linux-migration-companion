import type { AppSection, Locale } from "../domain/types";
import { messages, sectionLabel, t } from "../i18n";

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
  children: React.ReactNode;
}

export function Layout({
  locale,
  section,
  onLocaleChange,
  onSectionChange,
  children
}: LayoutProps) {
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
          <span className="brand-mark" aria-hidden="true">
            LM
          </span>
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
        <span>{t(locale, "privacyFooter")}</span>
        <span>{t(locale, "notAffiliated")}</span>
      </footer>
    </div>
  );
}

import type { Locale } from "../domain/types";

interface SupportPanelProps {
  locale: Locale;
}

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

export function TeaCupIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 18h25v11a10 10 0 0 1-10 10h-5A10 10 0 0 1 9 29V18Z" />
      <path d="M34 22h3a6 6 0 0 1 0 12h-5" />
      <path d="M16 13c-2-2 2-4 0-7M24 13c-2-2 2-4 0-7" />
      <path d="M7 42h31" />
    </svg>
  );
}

export function SupportPanel({ locale }: SupportPanelProps) {
  return (
    <section className="support-page" aria-labelledby="support-title">
      <div className="support-card">
        <span className="eyebrow">SUPPORT</span>
        <div className="support-visual" aria-hidden="true">
          <TeaCupIcon />
        </div>
        <h1 id="support-title">
          {copy(
            locale,
            "Did the Linux Migration Companion help you?",
            "Hilft dir der Linux Migration Companion?"
          )}
        </h1>
        <p>
          {copy(
            locale,
            "The tool stays free, local-first and tracking-free.",
            "Das Tool bleibt kostenlos, lokal und ohne Tracking."
          )}
        </p>
        <p>
          {copy(
            locale,
            "If you'd like to support continued development, you can buy Dennis an East Frisian tea.",
            "Wenn du die Weiterentwicklung unterstützen möchtest, kannst du Dennis freiwillig einen ostfriesischen Tee ausgeben."
          )}
        </p>
        <a
          className="button support-tea-button"
          href="https://buymeacoffee.com/dennishilk"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={copy(
            locale,
            "Buy Dennis an East Frisian tea (opens in a new tab)",
            "Dennis einen ostfriesischen Tee ausgeben (öffnet in einem neuen Tab)"
          )}
        >
          <TeaCupIcon className="support-button-icon" />
          {copy(locale, "Buy me an East Frisian tea", "Tee ausgeben")}
        </a>
        <div className="support-links" aria-label={copy(locale, "More links", "Weitere Links")}>
          <a
            href="https://dennishilk.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy(locale, "dennishilk.com (opens in a new tab)", "dennishilk.com (öffnet in einem neuen Tab)")}
          >
            dennishilk.com
          </a>
          <a
            href="https://github.com/dennishilk/linux-migration-companion"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy(locale, "GitHub repository (opens in a new tab)", "GitHub-Repository (öffnet in einem neuen Tab)")}
          >
            GitHub
          </a>
        </div>
        <p className="support-boundary">
          {copy(
            locale,
            "Support is entirely voluntary. It does not unlock features or include paid support.",
            "Die Unterstützung ist vollständig freiwillig. Sie schaltet keine Funktionen frei und umfasst keinen bezahlten Support."
          )}
        </p>
      </div>
    </section>
  );
}

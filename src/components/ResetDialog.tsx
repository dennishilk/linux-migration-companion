import { useEffect, useRef } from "react";
import type { Locale } from "../domain/types";
import { t } from "../i18n";

interface ResetDialogProps {
  locale: Locale;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetDialog({
  locale,
  open,
  onCancel,
  onConfirm
}: ResetDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    return () => previousFocus?.focus();
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== "Tab") return;

    const first = cancelRef.current;
    const last = confirmRef.current;
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="reset-dialog-backdrop">
      <div
        ref={dialogRef}
        className="reset-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description reset-dialog-export"
        onKeyDown={handleKeyDown}
      >
        <p className="eyebrow">{t(locale, "resetEyebrow")}</p>
        <h2 id="reset-dialog-title">{t(locale, "resetDialogTitle")}</h2>
        <p id="reset-dialog-description">
          {t(locale, "resetDialogDescription")}
        </p>
        <ul>
          <li>{t(locale, "resetAdvisor")}</li>
          <li>{t(locale, "resetSoftware")}</li>
          <li>{t(locale, "resetHardware")}</li>
          <li>{t(locale, "resetPlans")}</li>
          <li>{t(locale, "resetPassport")}</li>
        </ul>
        <p id="reset-dialog-export" className="reset-dialog-export">
          {t(locale, "resetExportFirst")}
        </p>
        <div className="reset-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="button secondary"
            onClick={onCancel}
          >
            {t(locale, "cancel")}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="button danger"
            onClick={onConfirm}
          >
            {t(locale, "resetEverything")}
          </button>
        </div>
      </div>
    </div>
  );
}

import { distroById } from "../data/distros";
import type { Locale, MediaProgress, MediaStepId } from "../domain/types";
import { t } from "../i18n";

interface MediaGuideProps {
  locale: Locale;
  selectedDistroId: string | null;
  progress: MediaProgress;
  onChange: (progress: MediaProgress) => void;
  onContinue: () => void;
}

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const writerByTool = {
  rufus_or_etcher: {
    label: "Rufus / balenaEtcher",
    url: "https://rufus.ie/"
  },
  fedora_media_writer: {
    label: "Fedora Media Writer",
    url: "https://fedoraproject.org/workstation/download/"
  },
  official_guidance: {
    label: "Official project guidance",
    url: ""
  }
} as const;

export function MediaGuide({
  locale,
  selectedDistroId,
  progress,
  onChange,
  onContinue
}: MediaGuideProps) {
  const distro = selectedDistroId ? distroById.get(selectedDistroId) : undefined;
  const writer = distro ? writerByTool[distro.mediaTool] : writerByTool.official_guidance;
  const effectiveWriterUrl = writer.url || distro?.installUrl || "https://www.linuxfoundation.org/";
  const steps: Array<{
    id: MediaStepId;
    title: string;
    body: string;
    link?: { label: string; url: string };
  }> = [
    {
      id: "download",
      title: copy(locale, "Download only from the official project", "Nur beim offiziellen Projekt herunterladen"),
      body: copy(locale, "Choose the selected edition and note its filename. Avoid mirrors advertised by third parties.", "Gewählte Edition und Dateinamen notieren. Von Drittseiten beworbene Mirrors vermeiden."),
      ...(distro ? { link: { label: t(locale, "officialDownload"), url: distro.downloadUrl } } : {})
    },
    {
      id: "verify",
      title: copy(locale, "Verify the image before writing", "Abbild vor dem Schreiben prüfen"),
      body: copy(locale, "Follow the project's current checksum or signature instructions. Do not trust a checksum copied into this Companion.", "Aktuelle Prüfsummen- oder Signaturanleitung des Projekts befolgen. Keiner in diesen Companion kopierten Prüfsumme vertrauen."),
      ...(distro ? { link: { label: t(locale, "officialVerify"), url: distro.verifyUrl } } : {})
    },
    {
      id: "write",
      title: copy(locale, "Hand off to an established media writer", "An bewährtes Schreibprogramm übergeben"),
      body: copy(locale, "Identify the removable drive by capacity and unplug unrelated removable disks. This app never accesses the drive.", "Wechseldatenträger anhand der Kapazität identifizieren und andere externe Datenträger abziehen. Diese App greift niemals auf den Datenträger zu."),
      link: { label: `${t(locale, "writer")}: ${writer.label}`, url: effectiveWriterUrl }
    },
    {
      id: "boot",
      title: copy(locale, "Use the one-time boot menu", "Einmaliges Boot-Menü nutzen"),
      body: copy(locale, "Boot the USB without changing the permanent boot order when your firmware offers that option.", "USB starten, ohne die dauerhafte Boot-Reihenfolge zu ändern, wenn die Firmware diese Option bietet.")
    },
    {
      id: "test",
      title: copy(locale, "Choose the live/test option", "Live-/Test-Option wählen"),
      body: copy(locale, "Do not start installation. Complete the Live Test Assistant against the actual hardware and workflows.", "Installation nicht starten. Den Live Test Assistant mit echter Hardware und echten Abläufen abschließen.")
    },
    {
      id: "return",
      title: copy(locale, "Return with evidence", "Mit Evidenz zurückkehren"),
      body: copy(locale, "Save test results in the local Passport. Keep Windows until blockers and essential UNKNOWN items are resolved.", "Testergebnisse im lokalen Passport speichern. Windows behalten, bis Blocker und wichtige UNBEKANNT-Punkte geklärt sind.")
    }
  ];

  return (
    <section aria-labelledby="media-title">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">08 / SAFE MEDIA HANDOFF</p>
          <h1 id="media-title">{t(locale, "mediaTitle")}</h1>
          <p>{t(locale, "mediaLead")}</p>
        </div>
        <div className="selected-target">
          <span>{copy(locale, "Selected target", "Gewähltes Ziel")}</span>
          <strong>{distro ? `${distro.name} ${distro.edition ?? ""}` : copy(locale, "Choose a distro first", "Zuerst Distribution wählen")}</strong>
        </div>
      </div>

      {!distro ? (
        <div className="notice notice-warning">
          <strong>{copy(locale, "No distribution selected", "Keine Distribution ausgewählt")}</strong>
          <p>{copy(locale, "Return to the Fit Advisor and choose one profile for official links.", "Zum Eignungscheck zurückkehren und ein Profil für offizielle Links wählen.")}</p>
        </div>
      ) : null}

      <ol className="media-steps">
        {steps.map((step, index) => (
          <li className={progress[step.id] ? "complete" : ""} key={step.id}>
            <div className="media-step-number">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              {step.link ? (
                <a href={step.link.url} target="_blank" rel="noreferrer">
                  {step.link.label} ↗ <span className="sr-only">{t(locale, "openNew")}</span>
                </a>
              ) : null}
            </div>
            <label className="completion-check">
              <input
                type="checkbox"
                checked={progress[step.id]}
                onChange={(event) => onChange({ ...progress, [step.id]: event.target.checked })}
              />
              <span>{t(locale, "markDone")}</span>
            </label>
          </li>
        ))}
      </ol>

      <div className="notice notice-blocker installation-boundary">
        <strong>{copy(locale, "Installation boundary", "Installationsgrenze")}</strong>
        <p>{t(locale, "installationBoundary")}</p>
        {distro ? (
          <a href={distro.installUrl} target="_blank" rel="noreferrer">
            {copy(locale, "Official installation documentation", "Offizielle Installationsdokumentation")} ↗
          </a>
        ) : null}
      </div>

      <div className="panel-actions">
        <span>{Object.values(progress).filter(Boolean).length} / {steps.length} {copy(locale, "steps recorded", "Schritte erfasst")}</span>
        <button type="button" className="button primary" onClick={onContinue}>
          {copy(locale, "Review Migration Passport", "Migration Passport prüfen")}
        </button>
      </div>
    </section>
  );
}

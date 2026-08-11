import { useRef, useState } from "react";
import { hardwareClassById } from "../data/hardware";
import type {
  HardwareClassId,
  HardwareSnapshot,
  HardwareSnapshotCategory,
  Locale,
  StoredHardwareSnapshot
} from "../domain/types";
import { collectBrowserSnapshot } from "../hardware/browserSnapshot";
import {
  MAX_HARDWARE_SNAPSHOT_BYTES,
  parseHardwareSnapshotText
} from "../hardware/snapshotSchema";
import { localize } from "../i18n";

interface HardwareSnapshotPanelProps {
  locale: Locale;
  record: StoredHardwareSnapshot | null;
  onSnapshot: (record: StoredHardwareSnapshot) => void;
}

type SnapshotStatus =
  | "idle"
  | "browser_success"
  | "import_success"
  | "snapshot_invalid_json"
  | "snapshot_too_large"
  | "snapshot_too_deep"
  | "snapshot_prohibited_field"
  | "snapshot_schema_invalid";

const copy = (locale: Locale, en: string, de: string) =>
  locale === "de" ? de : en;

const supplementalCategoryLabels: Record<
  Exclude<
    HardwareSnapshotCategory,
    | "graphics"
    | "hybrid_graphics"
    | "wifi"
    | "bluetooth"
    | "ethernet"
    | "audio"
    | "usb_audio"
    | "webcam"
    | "microphone"
    | "fingerprint"
    | "dock"
    | "external_monitors"
    | "hidpi"
    | "printer"
    | "scanner"
    | "capture_device"
    | "game_controller"
    | "racing_wheel"
    | "special_usb"
  >,
  { en: string; de: string }
> = {
  cpu: { en: "CPU", de: "CPU" },
  storage: { en: "Storage", de: "Speichergerät" },
  usb_controller: { en: "USB controller", de: "USB-Controller" },
  input_device: { en: "Input device", de: "Eingabegerät" },
  display: { en: "Display", de: "Bildschirm" }
};

function categoryLabel(category: HardwareSnapshotCategory, locale: Locale) {
  const hardware = hardwareClassById.get(category as HardwareClassId);
  if (hardware) return localize(hardware.title, locale);
  return supplementalCategoryLabels[
    category as keyof typeof supplementalCategoryLabels
  ][locale];
}

const snapshotValueLabels: Record<string, { en: string; de: string }> = {
  unknown: { en: "Unknown", de: "Unbekannt" },
  unavailable: { en: "Unavailable", de: "Nicht verfügbar" },
  enabled: { en: "Enabled", de: "Aktiviert" },
  disabled: { en: "Disabled", de: "Deaktiviert" },
  supported: { en: "Supported by CPU", de: "Von der CPU unterstützt" },
  uefi: { en: "UEFI", de: "UEFI" },
  legacy: { en: "Legacy BIOS", de: "Legacy-BIOS" },
  desktop: { en: "Desktop", de: "Desktop" },
  laptop: { en: "Laptop", de: "Laptop" },
  tablet: { en: "Tablet", de: "Tablet" },
  virtual: { en: "Virtual machine", de: "Virtuelle Maschine" },
  adapter_available: { en: "Adapter available", de: "Adapter verfügbar" },
  adapter_unavailable: { en: "No adapter exposed", de: "Kein Adapter freigegeben" },
  api_unavailable: { en: "API unavailable", de: "API nicht verfügbar" }
};

function snapshotValue(value: string, locale: Locale): string {
  return snapshotValueLabels[value]?.[locale] ?? value.toUpperCase();
}

function snapshotDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function sourceLabel(source: HardwareSnapshot["source"], locale: Locale) {
  if (source === "windows_collector") {
    return copy(locale, "Windows collector", "Windows-Collector");
  }
  if (source === "linux_collector") {
    return copy(locale, "Linux collector", "Linux-Collector");
  }
  return copy(locale, "Browser reported", "Vom Browser gemeldet");
}

function statusMessage(status: SnapshotStatus, locale: Locale): string {
  const messages: Record<SnapshotStatus, { en: string; de: string }> = {
    idle: { en: "", de: "" },
    browser_success: {
      en: "Limited browser-reported facts recorded. No device was declared compatible.",
      de: "Begrenzte Browserangaben wurden erfasst. Kein Gerät wurde als kompatibel eingestuft."
    },
    import_success: {
      en: "Snapshot structure validated and imported. The claimed collector source is not an authenticity proof.",
      de: "Die Snapshot-Struktur wurde validiert und importiert. Die angegebene Collector-Quelle beweist nicht die Echtheit."
    },
    snapshot_invalid_json: {
      en: "The file is not valid JSON.",
      de: "Die Datei enthält kein gültiges JSON."
    },
    snapshot_too_large: {
      en: "The snapshot exceeds the 128 KiB limit.",
      de: "Der Snapshot überschreitet die Grenze von 128 KiB."
    },
    snapshot_too_deep: {
      en: "The snapshot is nested too deeply.",
      de: "Der Snapshot ist zu tief verschachtelt."
    },
    snapshot_prohibited_field: {
      en: "The snapshot contains a prohibited private or unsafe field.",
      de: "Der Snapshot enthält ein verbotenes privates oder unsicheres Feld."
    },
    snapshot_schema_invalid: {
      en: "The snapshot has an unknown version, extra field, invalid value or contradictory source.",
      de: "Der Snapshot enthält eine unbekannte Version, ein Zusatzfeld, einen ungültigen Wert oder eine widersprüchliche Quelle."
    }
  };
  return messages[status][locale];
}

export function HardwareSnapshotPanel({
  locale,
  record,
  onSnapshot
}: HardwareSnapshotPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<SnapshotStatus>("idle");
  const [browserBusy, setBrowserBusy] = useState(false);
  const base = import.meta.env.BASE_URL;

  const runBrowserSnapshot = async () => {
    setBrowserBusy(true);
    const snapshot = await collectBrowserSnapshot();
    const acquiredAt = new Date().toISOString();
    onSnapshot({ acquisition: "browser_runtime", acquiredAt, snapshot });
    setStatus("browser_success");
    setBrowserBusy(false);
  };

  const importSnapshot = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > MAX_HARDWARE_SNAPSHOT_BYTES) {
        throw new Error("snapshot_too_large");
      }
      const snapshot = parseHardwareSnapshotText(await file.text());
      onSnapshot({
        acquisition: "file_import",
        acquiredAt: new Date().toISOString(),
        snapshot
      });
      setStatus("import_success");
    } catch (error) {
      const code = error instanceof Error ? error.message : "snapshot_schema_invalid";
      const allowed: SnapshotStatus[] = [
        "snapshot_invalid_json",
        "snapshot_too_large",
        "snapshot_too_deep",
        "snapshot_prohibited_field",
        "snapshot_schema_invalid"
      ];
      setStatus(
        allowed.includes(code as SnapshotStatus)
          ? (code as SnapshotStatus)
          : "snapshot_schema_invalid"
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="hardware-snapshot-panel" aria-labelledby="snapshot-title">
      <div className="snapshot-heading">
        <div>
          <span className="tier tier-exploratory">
            {copy(locale, "OPTIONAL · READ ONLY", "OPTIONAL · NUR LESEND")}
          </span>
          <h2 id="snapshot-title">
            {copy(locale, "Hardware snapshot", "Hardware-Snapshot")}
          </h2>
          <p>
            {copy(
              locale,
              "Detection records hardware facts only. It never proves Linux support, never passes a live test and is not required to use the Companion.",
              "Die Erkennung erfasst ausschließlich Hardware-Fakten. Sie beweist niemals Linux-Unterstützung, besteht keinen Live-Test und ist für die Nutzung des Companions nicht erforderlich."
            )}
          </p>
        </div>
        <div className="snapshot-equation" aria-label={copy(locale, "Detection is not verification", "Erkennung ist keine Verifizierung") }>
          <span>{copy(locale, "DETECTED FACT", "ERKANNTER FAKT")}</span>
          <strong>≠</strong>
          <span>{copy(locale, "LINUX VERIFIED", "LINUX VERIFIZIERT")}</span>
        </div>
      </div>

      <div className="snapshot-options">
        <article>
          <strong>{copy(locale, "Enter manually", "Manuell eintragen")}</strong>
          <p>
            {copy(
              locale,
              "The evidence cards below remain the complete manual path.",
              "Die Evidenzkarten unten bleiben der vollständige manuelle Weg."
            )}
          </p>
          <span>{copy(locale, "Always available", "Immer verfügbar")}</span>
        </article>

        <article>
          <strong>{copy(locale, "Browser snapshot", "Browser-Snapshot")}</strong>
          <p>
            {copy(
              locale,
              "Records only coarse, possibly privacy-reduced browser values and WebGPU availability. No renderer identity is requested.",
              "Erfasst nur grobe, möglicherweise datenschutzreduzierte Browserwerte und die WebGPU-Verfügbarkeit. Es wird keine Renderer-Identität abgefragt."
            )}
          </p>
          <button
            type="button"
            className="button secondary"
            disabled={browserBusy}
            onClick={() => void runBrowserSnapshot()}
          >
            {browserBusy
              ? copy(locale, "Reading…", "Wird gelesen…")
              : copy(locale, "Record browser facts", "Browser-Fakten erfassen")}
          </button>
        </article>

        <article>
          <strong>{copy(locale, "Import snapshot", "Snapshot importieren")}</strong>
          <p>
            {copy(
              locale,
              "Choose a strict schema-v1 JSON file from the Windows or Linux collector. Imported files are untrusted until validated.",
              "Wähle eine strikte Schema-v1-JSON-Datei des Windows- oder Linux-Collectors. Importierte Dateien gelten bis zur Validierung als nicht vertrauenswürdig."
            )}
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => inputRef.current?.click()}
          >
            {copy(locale, "Choose snapshot JSON", "Snapshot-JSON auswählen")}
          </button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            tabIndex={-1}
            accept="application/json,.json"
            aria-label={copy(
              locale,
              "Choose hardware snapshot JSON file",
              "Hardware-Snapshot-JSON-Datei auswählen"
            )}
            onChange={(event) => void importSnapshot(event.target.files?.[0])}
          />
        </article>
      </div>

      <div className="collector-instructions">
        <section className="collector-primary" aria-labelledby="windows-collector-title">
          <h3 id="windows-collector-title">
            {copy(
              locale,
              "Windows 10 / 11 Hardware Snapshot",
              "Windows 10 / 11 Hardware-Snapshot"
            )}
          </h3>
          <p>
            {copy(
              locale,
              "A portable, open-source and read-only tool. It needs no installation or administrator rights, has no account or upload, and creates one local JSON snapshot in Downloads. Detection is not Linux compatibility.",
              "Ein portables, quelloffenes und nur lesendes Tool. Es benötigt keine Installation oder Administratorrechte, kein Konto und keinen Upload und erstellt einen lokalen JSON-Snapshot im Downloads-Ordner. Erkennung ist keine Linux-Kompatibilität."
            )}
          </p>
          <a
            className="button primary compact"
            href={`${base}collectors/windows/LinuxMigrationCompanion-HardwareSnapshot.exe`}
            download
            aria-label={copy(
              locale,
              "Download Windows Hardware Snapshot executable",
              "Windows Hardware-Snapshot als ausführbare Datei herunterladen"
            )}
          >
            {copy(
              locale,
              "Download Windows Hardware Snapshot (.exe)",
              "Windows Hardware-Snapshot herunterladen (.exe)"
            )}
          </a>
          <p>
            <a
              href={`${base}collectors/windows/LinuxMigrationCompanion-HardwareSnapshot.exe.sha256`}
              download
            >
              {copy(locale, "SHA-256 checksum", "SHA-256-Prüfsumme")}
            </a>
          </p>
          <ol>
            <li>{copy(locale, "Download the executable.", "Lade die ausführbare Datei herunter.")}</li>
            <li>{copy(locale, "Open the file by double-clicking it.", "Öffne die Datei per Doppelklick.")}</li>
            <li>{copy(locale, "Click “Create hardware snapshot”.", "Klicke auf „Hardware-Snapshot erstellen“.")}</li>
            <li>{copy(locale, "Import the JSON file here.", "Importiere die JSON-Datei hier.")}</li>
            <li>{copy(locale, "Delete the collector and snapshot afterward if you no longer need them.", "Lösche Collector und Snapshot anschließend, wenn du sie nicht mehr benötigst.")}</li>
          </ol>
          <p className="collector-signing-note">
            {copy(
              locale,
              "Release-candidate status: this executable is currently unsigned. Windows may show a SmartScreen or reputation warning. Do not disable SmartScreen, Defender or organizational policy. A properly signed artifact is still required for a public release.",
              "Release-Candidate-Status: Diese ausführbare Datei ist derzeit nicht signiert. Windows kann eine SmartScreen- oder Reputationswarnung anzeigen. Deaktiviere weder SmartScreen noch Defender oder Organisationsrichtlinien. Für eine öffentliche Veröffentlichung ist weiterhin ein korrekt signiertes Artefakt erforderlich."
            )}
          </p>
        </section>

        <details>
          <summary>
            {copy(
              locale,
              "Advanced / source / manual PowerShell method",
              "Erweitert / Quelltext / manuelle PowerShell-Methode"
            )}
          </summary>
          <p>
            {copy(
              locale,
              "The readable PowerShell collector remains available as a reference implementation, advanced manual method and debugging aid. It queries an allowlist of built-in CIM classes, makes no network request and writes one new JSON file.",
              "Der lesbare PowerShell-Collector bleibt als Referenzimplementierung, erweiterte manuelle Methode und Debugging-Hilfe verfügbar. Er fragt eine Positivliste integrierter CIM-Klassen ab, stellt keine Netzwerkanfrage und schreibt genau eine neue JSON-Datei."
            )}
          </p>
          <a
            className="button secondary compact"
            href={`${base}collectors/windows/Collect-LinuxMigrationHardware.ps1`}
            download
          >
            {copy(locale, "Download PowerShell source", "PowerShell-Quelltext herunterladen")}
          </a>
          <ol>
            <li>{copy(locale, "Open the file in a text editor and inspect it.", "Datei in einem Texteditor öffnen und prüfen.")}</li>
            <li><code>powershell.exe -NoProfile -File .\Collect-LinuxMigrationHardware.ps1</code></li>
            <li>{copy(locale, "Inspect the resulting JSON before importing; delete it normally afterward if no longer needed.", "Das erzeugte JSON vor dem Import prüfen und anschließend normal löschen, wenn es nicht mehr benötigt wird.")}</li>
          </ol>
          <p className="privacy-line">
            {copy(
              locale,
              "Windows execution policy may block this script. Never weaken system or organizational policy to run it; use the executable, browser or manual path instead.",
              "Die Windows-Ausführungsrichtlinie kann dieses Skript blockieren. Schwäche niemals System- oder Organisationsrichtlinien, um es auszuführen; nutze stattdessen die ausführbare Datei, den Browser- oder den manuellen Weg."
            )}
          </p>
        </details>

        <details>
          <summary>{copy(locale, "Linux collector", "Linux-Collector")}</summary>
          <p>
            {copy(
              locale,
              "The dependency-free Python 3 source reads selected /proc and /sys files without sudo, package installation or shell execution. Missing interfaces remain unavailable.",
              "Der dependency-freie Python-3-Quelltext liest ausgewählte /proc- und /sys-Dateien ohne sudo, Paketinstallation oder Shell-Ausführung. Fehlende Schnittstellen bleiben nicht verfügbar."
            )}
          </p>
          <a
            className="button secondary compact"
            href={`${base}collectors/linux/collect-linux-hardware.py`}
            download
          >
            {copy(locale, "Download Linux collector", "Linux-Collector herunterladen")}
          </a>
          <ol>
            <li>{copy(locale, "Open the file in a text editor and inspect it.", "Datei in einem Texteditor öffnen und prüfen.")}</li>
            <li><code>python3 ./collect-linux-hardware.py</code></li>
            <li>{copy(locale, "Inspect the resulting JSON before importing; delete it normally afterward if no longer needed.", "Das erzeugte JSON vor dem Import prüfen und anschließend normal löschen, wenn es nicht mehr benötigt wird.")}</li>
          </ol>
          <p className="privacy-line">
            {copy(
              locale,
              "If Python 3 is unavailable, do not install anything just for this feature; use the browser or manual path.",
              "Wenn Python 3 fehlt, nichts nur für diese Funktion installieren; nutze den Browser- oder manuellen Weg."
            )}
          </p>
        </details>
      </div>

      <p className="snapshot-privacy-boundary">
        <strong>{copy(locale, "Not collected:", "Nicht erfasst:")}</strong>{" "}
        {copy(
          locale,
          "names of people or computers, accounts, email, IP or MAC addresses, Wi-Fi names or passwords, serial numbers, product keys, machine IDs, browser history, file names or contents, secrets, tokens and credentials.",
          "Namen von Personen oder Rechnern, Konten, E-Mail-, IP- oder MAC-Adressen, WLAN-Namen oder -Passwörter, Seriennummern, Produktschlüssel, Maschinen-IDs, Browserverlauf, Dateinamen oder -inhalte, Geheimnisse, Token und Zugangsdaten."
        )}
      </p>

      {status !== "idle" ? (
        <div
          className={`notice ${status.includes("success") ? "notice-info" : "notice-blocker"}`}
          role={status.includes("success") ? "status" : "alert"}
        >
          <strong>{statusMessage(status, locale)}</strong>
        </div>
      ) : null}

      {record ? (
        <div className="snapshot-result">
          <header>
            <div>
              <span>{sourceLabel(record.snapshot.source, locale)}</span>
              <h3>{copy(locale, "Current factual snapshot", "Aktueller Fakten-Snapshot")}</h3>
            </div>
            <strong>
              {record.snapshot.facts.length} {copy(locale, "device fact(s)", "Gerätefakt(en)")}
            </strong>
          </header>
          <p className="snapshot-trust-note">
            {record.acquisition === "file_import"
              ? copy(
                  locale,
                  "Imported file: schema validated; collector identity is a claim, not a signature.",
                  "Importierte Datei: Schema validiert; die Collector-Identität ist eine Angabe, keine Signatur."
                )
              : copy(
                  locale,
                  "Created in this browser from deliberately limited browser APIs.",
                  "In diesem Browser aus bewusst begrenzten Browser-APIs erstellt."
                )}
          </p>
          <p className="snapshot-replacement-note">
            {copy(
              locale,
              "Recording or importing another snapshot replaces this stored snapshot. Manual details and live-test results remain separate.",
              "Ein neu erfasster oder importierter Snapshot ersetzt diesen gespeicherten Snapshot. Manuelle Details und Live-Test-Ergebnisse bleiben getrennt."
            )}
          </p>
          <dl className="snapshot-system-grid">
            <div><dt>{copy(locale, "Reported OS", "Gemeldetes OS")}</dt><dd>{record.snapshot.system.osLabel ?? record.snapshot.system.osFamily.toUpperCase()}</dd></div>
            <div><dt>{copy(locale, "Architecture", "Architektur")}</dt><dd>{record.snapshot.system.architecture.toUpperCase()}</dd></div>
            <div><dt>{copy(locale, "Logical processors", "Logische Prozessoren")}</dt><dd>{record.snapshot.system.logicalProcessors ?? copy(locale, "Unavailable", "Nicht verfügbar")}</dd></div>
            <div><dt>{copy(locale, "Memory", "Arbeitsspeicher")}</dt><dd>{record.snapshot.system.memoryGiB ? `${record.snapshot.system.memoryGiB} GiB` : copy(locale, "Unavailable", "Nicht verfügbar")}</dd></div>
            <div><dt>{copy(locale, "Firmware / Secure Boot", "Firmware / Secure Boot")}</dt><dd>{snapshotValue(record.snapshot.system.firmware, locale)} · {snapshotValue(record.snapshot.system.secureBoot, locale)}</dd></div>
            <div><dt>{copy(locale, "Form factor", "Bauform")}</dt><dd>{snapshotValue(record.snapshot.system.formFactor, locale)}</dd></div>
            <div><dt>{copy(locale, "Connected displays", "Verbundene Bildschirme")}</dt><dd>{record.snapshot.system.connectedDisplays ?? copy(locale, "Unavailable", "Nicht verfügbar")}</dd></div>
            <div><dt>{copy(locale, "Virtualization", "Virtualisierung")}</dt><dd>{snapshotValue(record.snapshot.system.virtualization, locale)}</dd></div>
            <div><dt>{copy(locale, "Snapshot created", "Snapshot erstellt")}</dt><dd>{snapshotDate(record.snapshot.createdAt, locale)}</dd></div>
            <div><dt>{copy(locale, "Stored here", "Hier gespeichert")}</dt><dd>{snapshotDate(record.acquiredAt, locale)}</dd></div>
          </dl>
          {record.snapshot.browserCapabilities ? (
            <p className="browser-capabilities">
              WebGPU: {snapshotValue(record.snapshot.browserCapabilities.webgpu, locale)} · {copy(locale, "processor and memory values may be privacy-reduced", "Prozessor- und Speicherwerte können datenschutzbedingt reduziert sein")}
            </p>
          ) : null}
          {record.snapshot.facts.length ? (
            <details>
              <summary>{copy(locale, "Inspect detected facts", "Erkannte Fakten prüfen")}</summary>
              <ul className="snapshot-fact-list">
                {record.snapshot.facts.map((fact, index) => (
                  <li key={`${fact.category}-${fact.name}-${index}`}>
                    <strong>{categoryLabel(fact.category, locale)}</strong>
                    <span>
                      {fact.vendor ? `${fact.vendor} · ` : ""}{fact.name}
                      {fact.vendorId && fact.deviceId
                        ? ` · ${fact.bus?.toUpperCase() ?? "ID"} ${fact.vendorId}:${fact.deviceId}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p>{copy(locale, "No device identity was exposed by this browser snapshot.", "Dieser Browser-Snapshot hat keine Geräteidentität offengelegt.")}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

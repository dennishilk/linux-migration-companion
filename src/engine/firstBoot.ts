import { distroById } from "../data/distros";
import { softwareById } from "../data/software";
import type {
  AdvisorAnswers,
  DataMigrationSelections,
  FirstBootStep,
  HardwareProfile,
  LiveTestResults,
  LocalizedText,
  MigrationPassport,
  SoftwareSelections
} from "../domain/types";

const message = (en: string, de: string): LocalizedText => ({ en, de });

function step(
  id: string,
  title: LocalizedText,
  what: LocalizedText,
  why: LocalizedText,
  risk: LocalizedText,
  verify: LocalizedText,
  backOut: LocalizedText
): FirstBootStep {
  return { id, title, what, why, risk, verify, backOut };
}

interface FirstBootInput {
  distroId: string | null;
  answers: AdvisorAnswers;
  selections: SoftwareSelections;
  liveTests: LiveTestResults;
  hardware?: HardwareProfile;
  dataMigration: DataMigrationSelections;
}

function normalizeInput(
  passportOrDistroId: MigrationPassport | string | null,
  answers?: AdvisorAnswers,
  selections?: SoftwareSelections,
  liveTests?: LiveTestResults
): FirstBootInput {
  if (typeof passportOrDistroId === "object" && passportOrDistroId !== null) {
    return {
      distroId: passportOrDistroId.selectedDistroId,
      answers: passportOrDistroId.answers,
      selections: passportOrDistroId.softwareSelections,
      liveTests: passportOrDistroId.liveTests,
      hardware: passportOrDistroId.hardware,
      dataMigration: passportOrDistroId.dataMigration
    };
  }
  if (!answers || !selections || !liveTests) {
    throw new Error("first_boot_input_incomplete");
  }
  return {
    distroId: passportOrDistroId,
    answers,
    selections,
    liveTests,
    dataMigration: {}
  };
}

export function buildFirstBootPlan(passport: MigrationPassport): FirstBootStep[];
export function buildFirstBootPlan(
  distroId: string | null,
  answers: AdvisorAnswers,
  selections: SoftwareSelections,
  liveTests: LiveTestResults
): FirstBootStep[];
export function buildFirstBootPlan(
  passportOrDistroId: MigrationPassport | string | null,
  answers?: AdvisorAnswers,
  selections?: SoftwareSelections,
  liveTests?: LiveTestResults
): FirstBootStep[] {
  const input = normalizeInput(passportOrDistroId, answers, selections, liveTests);
  const distro = input.distroId ? distroById.get(input.distroId) : undefined;
  const distroName = distro?.name ?? "Linux";
  const selectedRecords = Object.keys(input.selections)
    .map((id) => softwareById.get(id))
    .filter((record) => record !== undefined);
  const selectedIds = new Set(selectedRecords.map((record) => record.id));
  const dataIds = new Set(Object.keys(input.dataMigration));
  const plan: FirstBootStep[] = [];

  const selectedBlockers = selectedRecords.filter(
    (record) =>
      input.selections[record.id] === "essential" && record.blockerWhenEssential
  );
  if (selectedBlockers.length) {
    plan.push(
      step(
        "retain-windows",
        message("Keep Windows accessible", "Windows zugänglich behalten"),
        message(
          `Do not remove Windows while ${selectedBlockers.map((record) => record.name).join(", ")} remain essential and unproven on Linux.`,
          `Windows nicht entfernen, solange ${selectedBlockers.map((record) => record.name).join(", ")} unverzichtbar und unter Linux unbewiesen bleiben.`
        ),
        message("The existing Windows workflow is currently the only recorded proven path.", "Der bestehende Windows-Ablauf ist derzeit der einzige erfasste, bewährte Weg."),
        message("Removing it now could remove access to essential work, files, licences or support.", "Ein Entfernen könnte den Zugriff auf unverzichtbare Arbeit, Dateien, Lizenzen oder Support beseitigen."),
        message("Open every essential workflow on Windows and confirm the source data and recovery path remain available.", "Jeden unverzichtbaren Ablauf unter Windows öffnen und verfügbare Quelldaten sowie Wiederherstellungsweg bestätigen."),
        message("Make no disk-layout change. Continue with a live test, separate test device or reversible dual-boot plan only after backup.", "Keine Datenträgeränderung vornehmen. Erst nach einem Backup mit Live-Test, separatem Testgerät oder reversiblem Dual-Boot-Plan fortfahren.")
      )
    );
  }

  plan.push(
    step(
      "updates",
      message("Review and install system updates", "Systemupdates prüfen und installieren"),
      message(
        `Open ${distroName}'s official graphical update tool, read the proposed changes, and use the project's current guidance.`,
        `Das offizielle grafische Update-Werkzeug von ${distroName} öffnen, die vorgeschlagenen Änderungen lesen und aktuelle Projekthinweise nutzen.`
      ),
      message("Reviewed updates correct known security and stability defects and establish a supported baseline.", "Geprüfte Updates beheben bekannte Sicherheits- und Stabilitätsfehler und schaffen eine unterstützte Grundlage."),
      message("Updates can change kernels, drivers or boot components. Do not interrupt them, and do not copy commands from old forum posts.", "Updates können Kernel, Treiber oder Boot-Komponenten ändern. Nicht unterbrechen und keine Befehle aus alten Forenbeiträgen kopieren."),
      message("Reboot only if the official tool requests it, then open the update tool again and repeat core hardware checks.", "Nur bei Aufforderung des offiziellen Werkzeugs neu starten, danach das Update-Werkzeug erneut öffnen und Kern-Hardwaretests wiederholen."),
      message("Use the distribution's documented recovery or snapshot path if an update causes a regression; keep the live USB and Windows recovery path available.", "Bei Regression den dokumentierten Recovery-/Snapshot-Weg der Distribution nutzen; Live-USB und Windows-Recovery verfügbar halten.")
    ),
    step(
      "backup",
      message("Configure and restore-test a real backup", "Ein echtes Backup einrichten und wiederherstellen"),
      message("Choose an independent destination, back up irreplaceable data, and restore representative files into a temporary folder.", "Ein unabhängiges Ziel wählen, unersetzliche Daten sichern und repräsentative Dateien in einen temporären Ordner wiederherstellen."),
      message("A snapshot on the same disk is not a backup. Restore evidence matters more than a successful progress bar.", "Ein Snapshot auf demselben Datenträger ist kein Backup. Wiederherstellungsnachweis ist wichtiger als ein erfolgreicher Fortschrittsbalken."),
      message("An untested or always-connected backup can be incomplete, encrypted with a lost key, or damaged with the source.", "Ein ungetestetes oder dauerhaft verbundenes Backup kann unvollständig, mit verlorenem Schlüssel verschlüsselt oder zusammen mit der Quelle beschädigt sein."),
      message("Open restored documents, photos and one application export without using the original path.", "Wiederhergestellte Dokumente, Fotos und einen Anwendungsexport ohne Nutzung des Originalpfads öffnen."),
      message("Keep the original Windows data and the independent backup unchanged until the Linux restore has been proven.", "Windows-Originaldaten und unabhängiges Backup unverändert lassen, bis die Linux-Wiederherstellung bewiesen ist.")
    )
  );

  if (input.answers.gpuVendor === "nvidia") {
    plan.push(
      step(
        "nvidia",
        message("Verify the supported NVIDIA driver path", "Unterstützten NVIDIA-Treiberweg prüfen"),
        message(`Use ${distroName}'s documented driver-management workflow. Do not hard-code a driver version from this plan.`, `Den dokumentierten Treiberweg von ${distroName} nutzen. Keine Treiberversion aus diesem Plan fest übernehmen.`),
        message("The correct driver branch depends on the exact GPU, kernel, distribution and support policy.", "Der richtige Treiberzweig hängt von exakter GPU, Kernel, Distribution und Supportrichtlinie ab."),
        message(input.answers.secureBoot === "required" ? "Secure Boot may reject an unsigned module. Keep Secure Boot enabled and follow the distribution's trusted module or key-enrolment guidance." : "A wrong or unsupported driver can cause a black screen, missing acceleration, suspend failure or broken external displays.", input.answers.secureBoot === "required" ? "Secure Boot kann ein unsigniertes Modul ablehnen. Secure Boot aktiviert lassen und den Vertrauens-/Schlüsselweg der Distribution befolgen." : "Ein falscher oder nicht unterstützter Treiber kann schwarzen Bildschirm, fehlende Beschleunigung, Standby- oder Displayfehler verursachen."),
        message("After reboot, verify native resolution, graphics acceleration, suspend/wake and every external display.", "Nach dem Neustart native Auflösung, Grafikbeschleunigung, Standby/Aufwachen und jeden externen Monitor prüfen."),
        message("Know the distribution's documented fallback graphics or recovery-boot path before changing the driver.", "Vor der Treiberänderung den dokumentierten Fallback-Grafik- oder Recovery-Boot-Weg der Distribution kennen.")
      )
    );
  }

  const browserSelected = ["firefox", "chrome", "edge"].some((id) => selectedIds.has(id));
  if (browserSelected || input.answers.office !== "none") {
    plan.push(
      step(
        "browser",
        message("Set up the browser without assuming profile parity", "Browser ohne angenommene Profilgleichheit einrichten"),
        message("Install the chosen browser from its official or distribution-supported source, then deliberately restore bookmarks, extensions and certificates.", "Den gewählten Browser aus offizieller oder distributionsunterstützter Quelle installieren und Lesezeichen, Erweiterungen sowie Zertifikate bewusst wiederherstellen."),
        message("The browser may carry office, identity, passkey, DRM and organization workflows—not just bookmarks.", "Der Browser kann Office-, Identitäts-, Passkey-, DRM- und Organisationsabläufe tragen – nicht nur Lesezeichen."),
        message("Blind profile-folder copying can import stale locks, incompatible extensions or secrets with unsafe permissions.", "Blindes Kopieren des Profilordners kann alte Sperren, inkompatible Erweiterungen oder Geheimnisse mit unsicheren Berechtigungen importieren."),
        message("Test sign-in, required sites, downloads, printing, video calls, DRM media and any organization certificate.", "Anmeldung, benötigte Websites, Downloads, Druck, Videoanrufe, DRM-Medien und Organisationszertifikate testen."),
        message("Keep the Windows browser profile and a bookmarks export until every required browser workflow works.", "Windows-Browserprofil und Lesezeichenexport behalten, bis jeder benötigte Browserablauf funktioniert.")
      )
    );
  }

  if (input.answers.office !== "none" || selectedRecords.some((record) => record.category === "office")) {
    plan.push(
      step(
        "office",
        message("Prove the office workflow with representative files", "Office-Ablauf mit repräsentativen Dateien beweisen"),
        message("Install the selected native suite or open the official web route, then test the hardest real documents before making it the default.", "Gewählte native Suite installieren oder offiziellen Webweg öffnen und die schwierigsten echten Dokumente testen, bevor sie Standard wird."),
        message("Opening a file is not proof of exact layout, formulas, macros, add-ins, signatures, collaboration or printing.", "Eine geöffnete Datei beweist keine exakten Layouts, Formeln, Makros, Add-ins, Signaturen, Zusammenarbeit oder Druckausgabe."),
        message("Saving from another suite can alter a production file. Always test on copies.", "Speichern aus einer anderen Suite kann eine Produktionsdatei verändern. Immer mit Kopien testen."),
        message("Compare exported PDFs, printed pages, formulas, tracked changes and collaboration with the Windows result.", "Exportierte PDFs, Druckseiten, Formeln, Änderungsverfolgung und Zusammenarbeit mit dem Windows-Ergebnis vergleichen."),
        message("Retain untouched originals and the Windows application until owners accept the tested result.", "Unveränderte Originale und Windows-Anwendung behalten, bis Verantwortliche das Testergebnis akzeptieren.")
      )
    );
  }

  if (selectedIds.has("steam") || input.answers.gameLaunchers.includes("steam")) {
    plan.push(
      step(
        "steam",
        message("Install Steam, then verify games one by one", "Steam installieren, dann Spiele einzeln prüfen"),
        message(`Use ${distroName}'s supported software source, sign in, and test each must-play title with its real controller, save and multiplayer mode.`, `Die unterstützte Softwarequelle von ${distroName} nutzen, anmelden und jeden Pflicht-Titel mit echtem Controller, Spielstand und Multiplayer-Modus testen.`),
        message("A working Steam client or Proton launch is not evidence for every game, anti-cheat system, mod or peripheral.", "Ein funktionierender Steam-Client oder Proton-Start ist kein Beweis für jedes Spiel, Anti-Cheat, Mod oder Gerät."),
        message("Cloud-save conflicts, anti-cheat policy and compatibility updates can change or remove a previously working path.", "Cloud-Save-Konflikte, Anti-Cheat-Richtlinien und Kompatibilitätsupdates können einen zuvor funktionierenden Weg verändern oder entfernen."),
        message("Play long enough to test input, audio, performance, online services, suspend and a save/load cycle.", "Lange genug spielen, um Eingabe, Audio, Leistung, Onlinedienste, Standby und einen Speicher-/Ladezyklus zu testen."),
        message("Keep Windows and an independent save backup until every must-play title passes your current test.", "Windows und ein unabhängiges Spielstand-Backup behalten, bis jeder Pflicht-Titel den aktuellen Test besteht.")
      )
    );
  }

  const required = input.hardware?.evidence;
  const needsPrinter = required?.printer.required || required?.scanner.required || input.liveTests.printer !== "not_applicable";
  if (needsPrinter) {
    plan.push(
      step(
        "printer",
        message("Set up and function-test printing and scanning", "Drucken und Scannen einrichten und funktional testen"),
        message("Use the distribution's printer settings and the exact device's official/OpenPrinting guidance; test every function you marked required.", "Druckereinstellungen der Distribution und offizielle/OpenPrinting-Hinweise zum exakten Gerät nutzen; jede benötigte Funktion testen."),
        message("Driverless printing can work while scanning, duplex, finishing, color, accounting or maintenance remains unavailable.", "Treiberloses Drucken kann funktionieren, während Scan, Duplex, Finishing, Farbe, Abrechnung oder Wartung fehlen."),
        message("Random vendor packages or old drivers can weaken system security or break after updates.", "Zufällige Herstellerpakete oder alte Treiber können die Systemsicherheit schwächen oder nach Updates ausfallen."),
        message("Print a representative color/duplex page and scan from the required feeder, resolution and destination.", "Eine repräsentative Farb-/Duplexseite drucken und mit benötigtem Einzug, Auflösung und Ziel scannen."),
        message("Keep the Windows printing/scanning path until all required output and maintenance functions pass.", "Windows-Druck-/Scanweg behalten, bis alle benötigten Ausgabe- und Wartungsfunktionen bestehen.")
      )
    );
  }

  if (required?.bluetooth.required) {
    plan.push(
      step(
        "bluetooth",
        message("Pair and recover every required Bluetooth device", "Jedes benötigte Bluetooth-Gerät koppeln und wiederverbinden"),
        message("Pair each required headset, controller or input device, then disconnect, reconnect and test after suspend.", "Jedes benötigte Headset, jeden Controller oder Eingabegerät koppeln, dann trennen, erneut verbinden und nach Standby testen."),
        message("Adapter detection does not prove the profiles, codecs, battery reporting or reconnection behavior you need.", "Adaptererkennung belegt weder benötigte Profile, Codecs, Akkuanzeige noch Wiederverbindung."),
        message("Removing pairings can affect the existing Windows setup or require access to a backup input device.", "Das Entfernen von Kopplungen kann das Windows-Setup beeinflussen oder ein Ersatz-Eingabegerät erfordern."),
        message("Verify audio/input, reconnect after reboot and suspend, and confirm the device works in the target application.", "Audio/Eingabe, Wiederverbindung nach Neustart und Standby sowie Funktion in der Zielanwendung prüfen."),
        message("Keep a wired input device available and preserve Windows pairing until the Linux behavior is stable.", "Kabelgebundenes Eingabegerät bereithalten und Windows-Kopplung behalten, bis Linux stabil funktioniert.")
      )
    );
  }

  if (required?.external_monitors.required || input.liveTests.external_monitor !== "not_applicable") {
    plan.push(
      step(
        "displays",
        message("Re-test every display path", "Jeden Displayweg erneut testen"),
        message("Connect every monitor and dock, set the intended resolution, refresh rate, scaling and layout, then suspend and wake once.", "Jeden Monitor und jedes Dock anschließen, gewünschte Auflösung, Bildrate, Skalierung und Anordnung setzen, dann Standby/Aufwachen testen."),
        message("Driver changes and installed-session display services can behave differently from the live session.", "Treiberänderungen und Displaydienste der installierten Sitzung können sich anders als im Live-System verhalten."),
        message("An unsupported mode can produce a blank display or unusable scaling; change one setting at a time.", "Ein nicht unterstützter Modus kann schwarzen Bildschirm oder unbrauchbare Skalierung verursachen; Einstellungen einzeln ändern."),
        message("Confirm all connectors, primary display, login screen, mixed scaling, suspend/wake and application placement.", "Alle Anschlüsse, primären Monitor, Anmeldebildschirm, gemischte Skalierung, Standby/Aufwachen und App-Platzierung prüfen."),
        message("Use the display settings' revert timer or reconnect one known-good display before changing another setting.", "Rücksetz-Timer der Anzeigeeinstellungen nutzen oder einen bekannten funktionierenden Monitor verbinden, bevor weitere Änderungen erfolgen.")
      )
    );
  }

  if (input.answers.development !== "none" || selectedRecords.some((record) => record.category === "development")) {
    plan.push(
      step(
        "development",
        message("Rebuild the development environment from evidence", "Entwicklungsumgebung evidenzbasiert neu aufbauen"),
        message("Install supported editors and toolchains, clone into a clean path, and recreate configuration without pasting secrets into this plan.", "Unterstützte Editoren und Toolchains installieren, in einen sauberen Pfad klonen und Konfiguration ohne Geheimnisse in diesem Plan neu erstellen."),
        message("A repository does not contain uncommitted work, ignored files, credentials, local databases or every platform SDK.", "Ein Repository enthält keine uncommittete Arbeit, ignorierten Dateien, Zugangsdaten, lokalen Datenbanken oder jedes Plattform-SDK."),
        message("Line endings, filesystem case sensitivity, executable bits, containers and Windows-only targets can change builds.", "Zeilenenden, Dateisystem-Groß-/Kleinschreibung, Ausführungsbits, Container und Windows-Ziele können Builds verändern."),
        message("Run tests, builds, containers, debugger, signing and a representative deployment from a clean clone.", "Tests, Builds, Container, Debugger, Signierung und ein repräsentatives Deployment aus einem sauberen Clone ausführen."),
        message("Keep the Windows toolchain and source backup until the Linux build is reproducible and the target platform is supported.", "Windows-Toolchain und Quellbackup behalten, bis der Linux-Build reproduzierbar und die Zielplattform unterstützt ist.")
      )
    );
  }

  if (["password-manager", "yubikey-security-key"].some((id) => selectedIds.has(id)) || dataIds.has("password_manager")) {
    plan.push(
      step(
        "identity",
        message("Restore password, passkey and security-key access safely", "Passwort-, Passkey- und Sicherheitsschlüsselzugriff sicher wiederherstellen"),
        message("Install the official client/extension, confirm a recovery route, and test required accounts and hardware keys before changing login enforcement.", "Offiziellen Client/Erweiterung installieren, Wiederherstellungsweg bestätigen und benötigte Konten sowie Hardwareschlüssel testen, bevor Anmeldezwang geändert wird."),
        message("Identity tools unlock the rest of the migration. Lockout can block cloud data, email, source control and recovery.", "Identitätswerkzeuge entsperren den Rest der Migration. Aussperrung kann Cloud-Daten, E-Mail, Quellcode und Recovery blockieren."),
        message("Import files and notes can expose the entire vault. Never store passwords, recovery codes or private keys in the Passport.", "Importdateien und Notizen können den gesamten Tresor offenlegen. Niemals Passwörter, Recovery-Codes oder private Schlüssel im Passport speichern."),
        message("Test sign-in, autofill, recovery, passkeys, security keys and one offline/reboot scenario while a second recovery method exists.", "Anmeldung, Autofill, Recovery, Passkeys, Sicherheitsschlüssel und ein Offline-/Neustart-Szenario bei vorhandenem zweiten Wiederherstellungsweg testen."),
        message("Retain the existing trusted device and recovery method until the Linux client is independently proven.", "Bestehendes vertrauenswürdiges Gerät und Wiederherstellungsweg behalten, bis der Linux-Client unabhängig bewiesen ist.")
      )
    );
  }

  if (["onedrive", "google_drive", "dropbox", "sharepoint-sync"].some((id) => selectedIds.has(id)) || ["cloud_storage", "onedrive", "google_drive", "dropbox"].some((id) => dataIds.has(id))) {
    plan.push(
      step(
        "cloud",
        message("Rebuild cloud storage without losing placeholders", "Cloud-Speicher ohne verlorene Platzhalter neu aufbauen"),
        message("Confirm Windows synchronization completed, make required placeholders available offline, then configure only a documented Linux/web route.", "Abgeschlossene Windows-Synchronisierung bestätigen, benötigte Platzhalter offline verfügbar machen und nur einen dokumentierten Linux-/Webweg einrichten."),
        message("A filename visible in Explorer may be a cloud placeholder rather than a local file available to back up.", "Ein im Explorer sichtbarer Dateiname kann ein Cloud-Platzhalter statt einer lokal sicherbaren Datei sein."),
        message("Two sync clients pointed at a migrated folder can create conflicts, deletions or duplicated data.", "Zwei Sync-Clients auf einem migrierten Ordner können Konflikte, Löschungen oder Duplikate verursachen."),
        message("Open representative files offline, test uploads/conflicts, and confirm shared libraries and retention behavior.", "Repräsentative Dateien offline öffnen, Uploads/Konflikte testen und gemeinsame Bibliotheken sowie Aufbewahrung bestätigen."),
        message("Keep the verified Windows sync state and independent backup until the new route has completed and been audited.", "Geprüften Windows-Sync-Stand und unabhängiges Backup behalten, bis der neue Weg abgeschlossen und geprüft ist.")
      )
    );
  }

  if (input.answers.mediaProduction !== "none" || selectedRecords.some((record) => record.category === "media" || record.category === "creative")) {
    plan.push(
      step(
        "multimedia",
        message("Verify multimedia, codecs and production I/O", "Multimedia, Codecs und Produktions-I/O prüfen"),
        message(`Use ${distroName}'s current official multimedia guidance and test the exact codecs, hardware acceleration, audio routing and devices you need.`, `Aktuelle offizielle Multimedia-Hinweise von ${distroName} nutzen und benötigte Codecs, Hardwarebeschleunigung, Audio-Routing und Geräte testen.`),
        message("Codec availability, licensing and hardware acceleration vary by distribution, source and media format.", "Codec-Verfügbarkeit, Lizenzierung und Hardwarebeschleunigung unterscheiden sich nach Distribution, Quelle und Medienformat."),
        message("Unreviewed third-party repositories can replace core media packages or create future update conflicts.", "Ungeprüfte Drittanbieter-Paketquellen können Kern-Medienpakete ersetzen oder spätere Updatekonflikte erzeugen."),
        message("Play and export representative media; test color, sync, plugins, capture, render and one long session.", "Repräsentative Medien abspielen und exportieren; Farbe, Synchronität, Plugins, Aufnahme, Rendering und eine lange Sitzung testen."),
        message("Keep original projects, media and the proven Windows production environment until outputs are accepted.", "Originalprojekte, Medien und bewährte Windows-Produktionsumgebung behalten, bis Ergebnisse akzeptiert sind.")
      )
    );
  }

  const nativeApps = selectedRecords.filter(
    (record) =>
      record.routes.includes("native") &&
      ![
        "steam",
        "password-manager",
        "yubikey-security-key",
        "firefox",
        "chrome",
        "edge"
      ].includes(record.id) &&
      !["office", "development", "media", "creative", "hardware", "cloud", "security"].includes(record.category)
  );
  if (nativeApps.length) {
    plan.push(
      step(
        "native-apps",
        message("Install selected native applications from reviewed sources", "Ausgewählte native Anwendungen aus geprüften Quellen installieren"),
        message(`Use ${distroName}'s supported graphical software source or the publisher's documented Linux package for: ${nativeApps.map((record) => record.name).join(", ")}.`, `Unterstützte grafische Softwarequelle von ${distroName} oder dokumentiertes Linux-Paket des Anbieters nutzen für: ${nativeApps.map((record) => record.name).join(", ")}.`),
        message("A native build reduces one compatibility layer but does not prove plugins, files, policy or hardware integration.", "Ein nativer Build reduziert eine Kompatibilitätsschicht, beweist aber keine Plugins, Dateien, Richtlinien oder Hardwareintegration."),
        message("Mixing repositories and downloading similarly named packages can create supply-chain or update risk.", "Gemischte Paketquellen und ähnlich benannte Downloads können Lieferketten- oder Update-Risiken erzeugen."),
        message("Confirm publisher/package identity, open representative data and test updates, integration and required extensions.", "Anbieter-/Paketidentität bestätigen, repräsentative Daten öffnen und Updates, Integration sowie benötigte Erweiterungen testen."),
        message("Remove only the newly added package through its documented package source; do not manually delete system files.", "Nur das neu hinzugefügte Paket über seine dokumentierte Paketquelle entfernen; keine Systemdateien manuell löschen.")
      )
    );
  }

  const unresolvedTests = Object.entries(input.liveTests).filter(
    ([, status]) => status === "issue" || status === "not_tested"
  );
  const unresolvedRequired = input.hardware
    ? Object.entries(input.hardware.evidence).filter(
        ([, evidence]) =>
          evidence.required && evidence.state !== "live_verified" && evidence.state !== "not_applicable"
      )
    : [];
  if (unresolvedTests.length || unresolvedRequired.length) {
    plan.push(
      step(
        "unresolved-hardware",
        message("Resolve unfinished hardware evidence", "Offene Hardware-Evidenz klären"),
        message(`${unresolvedTests.length} live-test item(s) and ${unresolvedRequired.length} required hardware item(s) remain unverified or failed. Re-test after reviewed updates.`, `${unresolvedTests.length} Live-Test-Punkt(e) und ${unresolvedRequired.length} benötigte Hardware-Punkt(e) bleiben ungeprüft oder fehlgeschlagen. Nach geprüften Updates erneut testen.`),
        message("Installed drivers and detected product names do not prove suspend, printing, audio, display, dock or specialist-device behavior.", "Installierte Treiber und erkannte Produktnamen beweisen weder Standby, Druck, Audio, Display, Dock noch Spezialgeräteverhalten."),
        message("Removing Windows while a required function is UNKNOWN or failed can remove the only proven fallback.", "Windows zu entfernen, solange eine benötigte Funktion UNBEKANNT oder fehlerhaft ist, kann den einzigen bewährten Rückfallweg beseitigen."),
        message("Repeat the real workflow and record LIVE VERIFIED only after observing the required function succeed.", "Den echten Ablauf wiederholen und LIVE VERIFIZIERT erst nach beobachtetem Funktionserfolg erfassen."),
        message("Leave the item UNKNOWN and keep Windows available if the test cannot be completed safely.", "Den Punkt UNBEKANNT lassen und Windows verfügbar halten, wenn der Test nicht sicher abgeschlossen werden kann.")
      )
    );
  }

  if (input.distroId === "nixos") {
    plan.push(
      step(
        "nixos-boundary",
        message("Keep NixOS hardware configuration machine-local", "NixOS-Hardwarekonfiguration rechnerlokal halten"),
        message("Generate and review hardware-configuration.nix on the installed machine. Do not import guessed disk, boot or secret settings from this Companion.", "hardware-configuration.nix auf dem installierten Rechner erzeugen und prüfen. Keine geratenen Datenträger-, Boot- oder Geheimniswerte aus diesem Companion übernehmen."),
        message("NixOS is declarative, but hardware facts and secret material remain machine-specific.", "NixOS ist deklarativ, doch Hardwarefakten und Geheimnisse bleiben rechnerspezifisch."),
        message("A copied hardware or boot configuration can make the system unbootable or expose secrets.", "Eine kopierte Hardware- oder Bootkonfiguration kann das System unstartbar machen oder Geheimnisse offenlegen."),
        message("Build the configuration, inspect the new generation, reboot, and prove hardware and rollback from the machine itself.", "Konfiguration bauen, neue Generation prüfen, neu starten und Hardware sowie Rollback am Rechner selbst beweisen."),
        message("Boot a prior NixOS generation; retain the live installer and data backup independently.", "Eine frühere NixOS-Generation booten; Live-Installer und Datenbackup unabhängig behalten.")
      )
    );
  }

  return plan;
}

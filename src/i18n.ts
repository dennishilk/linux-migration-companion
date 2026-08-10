import type { Locale, LocalizedText } from "./domain/types";

export const messages = {
  en: {
    appName: "Linux Migration Companion",
    alpha: "ALPHA / TEST PREVIEW",
    localOnly: "Runs locally in your browser. No account. No tracking.",
    language: "Language",
    sections: {
      advisor: "Fit advisor",
      software: "Software",
      hardware: "Hardware",
      live: "Live test",
      media: "USB guide",
      passport: "Passport",
      first_boot: "First boot"
    },
    startTitle: "Could Linux realistically replace Windows for you?",
    startLead:
      "Answer practical questions, record your real software and test the hardware before you remove anything.",
    analyze: "Analyze my fit",
    results: "Your explained matches",
    noPercent: "No fake percentages. Hard blockers always win.",
    strong: "STRONG FIT",
    possible: "POSSIBLE FIT — TRADE-OFFS",
    exploratory: "EXPLORATORY",
    not_recommended: "NOT RECOMMENDED",
    whyFits: "Why it fits",
    tradeoffs: "Trade-offs",
    causedBy: "Answers behind this result",
    changeResult: "What would change it",
    choose: "Use for my plan",
    chosen: "Selected",
    continueSoftware: "Review my software",
    searchSoftware: "Search applications and workflows",
    allCategories: "All categories",
    important: "Important",
    essential: "Essential",
    makeEssential: "Mark essential",
    makeImportant: "Mark important",
    add: "Add",
    remove: "Remove",
    source: "Primary source",
    reviewed: "Reviewed",
    verifyWorkflow: "What to verify",
    softwareReady: "No software blocker selected",
    softwareReview: "Trade-offs need representative testing",
    softwareBlocked: "Linux may not be a good primary fit for this workflow yet",
    scannerDeferred: "Read-only Windows scanner deferred for Alpha",
    scannerWhy:
      "The web browser cannot obtain trustworthy PCI/USB IDs or Secure Boot state. Alpha records manual facts and honestly keeps compatibility UNKNOWN.",
    neverCollected:
      "Never collected: username, hostname, serials, MAC addresses, documents, browser history or accounts.",
    evidenceState: "Evidence state",
    notes: "Private local notes",
    notesPlaceholder: "Optional notes stay in this browser and export only with your Passport.",
    nvidiaTitle: "NVIDIA does not force an enthusiast distro",
    nvidiaBody:
      "Use the selected distribution's supported driver workflow. Do not hard-code a driver version; test graphics, suspend and external displays in the live environment.",
    liveTitle: "Test the actual machine",
    liveLead:
      "A detected device is not proof that it works. Record each function from the target live session.",
    not_tested: "Not tested",
    works: "Works",
    issue: "Issue",
    not_applicable: "Not applicable",
    readinessReady: "Required live checks passed",
    readinessIncomplete: "Important tests are still incomplete",
    readinessBlocked: "A tested function has an issue",
    readinessKeepWindows: "Keep Windows / dual boot is advised",
    doNotRemove: "Do not remove Windows yet.",
    mediaTitle: "Prepare a safe live USB",
    mediaLead:
      "Alpha guides official downloads and established writers. It never writes disks itself.",
    officialDownload: "Official download page",
    officialVerify: "Official verification guide",
    writer: "Established media writer",
    markDone: "Mark done",
    installationBoundary:
      "The official distro installer owns partitioning and installation. This app never repartitions, erases Windows or changes bootloaders.",
    passportTitle: "Migration Passport",
    passportLead:
      "Your local, reusable evidence record. Inspect it, export it and bring it back after the live test.",
    export: "Export JSON",
    import: "Import JSON",
    importSuccess: "Passport imported and validated.",
    importError: "That file is not a valid Migration Passport.",
    clear: "Reset local Passport",
    workflow: "Workflow",
    software: "Software",
    hardware: "Hardware",
    gaming: "Gaming",
    primary: "Primary recommendation",
    alsoConsider: "Also consider",
    blocker: "Current blocker",
    nextStep: "Next safest step",
    noBlocker: "No current blocker",
    gamesUnverified: "Individual games not yet verified",
    testRequired: "Live test required",
    firstBootTitle: "Personalized first steps",
    guided: "GUIDED SETUP",
    explain: "EXPLAIN EACH STEP",
    noExecution:
      "Alpha does not execute commands, install packages or request administrator rights.",
    why: "Why this matters",
    safety: "Safety note",
    previous: "Previous",
    next: "Next",
    selectedCount: "selected",
    openNew: "Opens official site in a new tab",
    privacyFooter:
      "Local-first Alpha · no backend · no analytics · no destructive actions",
    notAffiliated:
      "Not affiliated with or endorsed by the listed Linux distributions or software vendors."
  },
  de: {
    appName: "Linux Migration Companion",
    alpha: "ALPHA / TESTVORSCHAU",
    localOnly: "Läuft lokal im Browser. Kein Konto. Kein Tracking.",
    language: "Sprache",
    sections: {
      advisor: "Eignungscheck",
      software: "Software",
      hardware: "Hardware",
      live: "Live-Test",
      media: "USB-Anleitung",
      passport: "Passport",
      first_boot: "Erster Start"
    },
    startTitle: "Könnte Linux Windows für dich realistisch ersetzen?",
    startLead:
      "Beantworte praktische Fragen, erfasse deine echte Software und teste die Hardware, bevor du irgendetwas entfernst.",
    analyze: "Meine Eignung prüfen",
    results: "Deine erklärten Empfehlungen",
    noPercent: "Keine erfundenen Prozentwerte. Harte Blocker haben immer Vorrang.",
    strong: "STARKE EIGNUNG",
    possible: "MÖGLICH — MIT KOMPROMISSEN",
    exploratory: "ZUM AUSPROBIEREN",
    not_recommended: "NICHT EMPFOHLEN",
    whyFits: "Warum es passt",
    tradeoffs: "Kompromisse",
    causedBy: "Ausschlaggebende Antworten",
    changeResult: "Was das Ergebnis ändern würde",
    choose: "Für meinen Plan verwenden",
    chosen: "Ausgewählt",
    continueSoftware: "Meine Software prüfen",
    searchSoftware: "Anwendungen und Arbeitsabläufe suchen",
    allCategories: "Alle Kategorien",
    important: "Wichtig",
    essential: "Unverzichtbar",
    makeEssential: "Als unverzichtbar markieren",
    makeImportant: "Als wichtig markieren",
    add: "Hinzufügen",
    remove: "Entfernen",
    source: "Primärquelle",
    reviewed: "Geprüft",
    verifyWorkflow: "Was du prüfen solltest",
    softwareReady: "Kein Software-Blocker ausgewählt",
    softwareReview: "Kompromisse müssen mit echten Dateien und Abläufen getestet werden",
    softwareBlocked: "Linux ist für diesen Arbeitsablauf derzeit vermutlich kein guter Hauptarbeitsplatz",
    scannerDeferred: "Read-only-Windows-Scanner für Alpha zurückgestellt",
    scannerWhy:
      "Der Browser erhält keine verlässlichen PCI-/USB-IDs und keinen sicheren Secure-Boot-Status. Alpha erfasst manuelle Angaben und lässt Kompatibilität ehrlich auf UNBEKANNT.",
    neverCollected:
      "Niemals erfasst: Benutzername, Hostname, Seriennummern, MAC-Adressen, Dokumente, Browserverlauf oder Konten.",
    evidenceState: "Evidenzstatus",
    notes: "Private lokale Notizen",
    notesPlaceholder: "Optionale Notizen bleiben im Browser und werden nur mit dem Passport exportiert.",
    nvidiaTitle: "NVIDIA zwingt dich nicht zu einer Enthusiasten-Distribution",
    nvidiaBody:
      "Nutze den unterstützten Treiberweg der gewählten Distribution. Keine feste Treiberversion: Grafik, Standby und externe Monitore im Live-System testen.",
    liveTitle: "Teste den tatsächlichen Rechner",
    liveLead:
      "Ein erkanntes Gerät ist noch kein Funktionsbeweis. Erfasse jede Funktion im Live-System der Ziel-Distribution.",
    not_tested: "Nicht getestet",
    works: "Funktioniert",
    issue: "Problem",
    not_applicable: "Nicht relevant",
    readinessReady: "Die erforderlichen Live-Tests wurden bestanden",
    readinessIncomplete: "Wichtige Tests fehlen noch",
    readinessBlocked: "Eine getestete Funktion hat ein Problem",
    readinessKeepWindows: "Windows behalten / Dual Boot wird empfohlen",
    doNotRemove: "Windows noch nicht entfernen.",
    mediaTitle: "Sicheren Live-USB-Stick vorbereiten",
    mediaLead:
      "Alpha führt durch offizielle Downloads und bewährte Schreibprogramme. Es schreibt niemals selbst auf Datenträger.",
    officialDownload: "Offizielle Downloadseite",
    officialVerify: "Offizielle Prüfanleitung",
    writer: "Bewährtes Schreibprogramm",
    markDone: "Als erledigt markieren",
    installationBoundary:
      "Partitionierung und Installation bleiben beim offiziellen Installer. Diese App partitioniert nicht, löscht Windows nicht und verändert keinen Bootloader.",
    passportTitle: "Migration Passport",
    passportLead:
      "Dein lokaler, wiederverwendbarer Evidenznachweis. Prüfen, exportieren und nach dem Live-Test wieder mitbringen.",
    export: "JSON exportieren",
    import: "JSON importieren",
    importSuccess: "Passport wurde importiert und validiert.",
    importError: "Diese Datei ist kein gültiger Migration Passport.",
    clear: "Lokalen Passport zurücksetzen",
    workflow: "Arbeitsablauf",
    software: "Software",
    hardware: "Hardware",
    gaming: "Gaming",
    primary: "Hauptempfehlung",
    alsoConsider: "Ebenfalls ansehen",
    blocker: "Aktueller Blocker",
    nextStep: "Nächster sicherer Schritt",
    noBlocker: "Kein aktueller Blocker",
    gamesUnverified: "Einzelne Spiele noch nicht geprüft",
    testRequired: "Live-Test erforderlich",
    firstBootTitle: "Personalisierte erste Schritte",
    guided: "GEFÜHRTE EINRICHTUNG",
    explain: "JEDEN SCHRITT ERKLÄREN",
    noExecution:
      "Alpha führt keine Befehle aus, installiert keine Pakete und fordert keine Administratorrechte an.",
    why: "Warum das wichtig ist",
    safety: "Sicherheitshinweis",
    previous: "Zurück",
    next: "Weiter",
    selectedCount: "ausgewählt",
    openNew: "Öffnet die offizielle Seite in einem neuen Tab",
    privacyFooter:
      "Lokale Alpha · kein Backend · keine Analyse · keine destruktiven Aktionen",
    notAffiliated:
      "Keine Verbindung zu oder Empfehlung durch die genannten Linux-Distributionen oder Softwareanbieter."
  }
} as const;

export type MessageKey = keyof typeof messages.en;

export function t(locale: Locale, key: MessageKey): string {
  const value = messages[locale][key];
  return typeof value === "string" ? value : "";
}

export function sectionLabel(
  locale: Locale,
  key: keyof typeof messages.en.sections
): string {
  return messages[locale].sections[key];
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

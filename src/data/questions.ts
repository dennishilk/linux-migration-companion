import type {
  AdvisorAnswers,
  GameLauncher,
  LocalizedText
} from "../domain/types";

export interface QuestionOption {
  value: string;
  label: LocalizedText;
  description?: LocalizedText;
}

export interface QuestionDefinition {
  field: Exclude<keyof AdvisorAnswers, "gameLaunchers">;
  group: "starting_point" | "confidence" | "maintenance" | "workflow" | "hardware";
  question: LocalizedText;
  help: LocalizedText;
  options: QuestionOption[];
}

const option = (
  value: string,
  en: string,
  de: string,
  descriptionEn?: string,
  descriptionDe?: string
): QuestionOption => ({
  value,
  label: { en, de },
  ...(descriptionEn && descriptionDe
    ? { description: { en: descriptionEn, de: descriptionDe } }
    : {})
});

export const questionGroups: Record<
  QuestionDefinition["group"],
  LocalizedText
> = {
  starting_point: { en: "Starting point", de: "Ausgangslage" },
  confidence: { en: "Experience and confidence", de: "Erfahrung und Sicherheit" },
  maintenance: { en: "Updates and maintenance", de: "Updates und Wartung" },
  workflow: { en: "Workflow and priorities", de: "Arbeitsablauf und Prioritäten" },
  hardware: { en: "Hardware and migration", de: "Hardware und Umstieg" }
};

export const questions: QuestionDefinition[] = [
  {
    field: "currentWindows",
    group: "starting_point",
    question: { en: "Which Windows environment are you leaving?", de: "Von welcher Windows-Umgebung kommst du?" },
    help: {
      en: "This changes support and migration warnings, not the distro score by itself.",
      de: "Das beeinflusst Support- und Umstiegshinweise, nicht allein die Distribution."
    },
    options: [
      option("windows11", "Windows 11", "Windows 11"),
      option("windows10", "Windows 10", "Windows 10"),
      option("other", "Older / other Windows", "Älteres / anderes Windows")
    ]
  },
  {
    field: "deviceType",
    group: "starting_point",
    question: { en: "What kind of computer is this?", de: "Was für ein Rechner ist es?" },
    help: {
      en: "Laptops add suspend, battery, camera and external-display tests.",
      de: "Bei Laptops kommen Standby, Akku, Kamera und externe Anzeigen hinzu."
    },
    options: [
      option("desktop", "Desktop PC", "Desktop-PC"),
      option("laptop", "Laptop / convertible", "Laptop / Convertible")
    ]
  },
  {
    field: "experience",
    group: "confidence",
    question: { en: "How much Linux experience do you have?", de: "Wie viel Linux-Erfahrung hast du?" },
    help: {
      en: "Advanced systems only rise when experience and intent agree.",
      de: "Fortgeschrittene Systeme steigen nur bei passender Erfahrung und Absicht."
    },
    options: [
      option("none", "None", "Keine"),
      option("beginner", "I have tried Linux", "Ich habe Linux ausprobiert"),
      option("intermediate", "I use Linux sometimes", "Ich nutze Linux gelegentlich"),
      option("advanced", "I administer Linux confidently", "Ich administriere Linux sicher"),
      option("expert", "Deep system experience", "Sehr tiefe Systemerfahrung")
    ]
  },
  {
    field: "terminalComfort",
    group: "confidence",
    question: { en: "How do you feel about the terminal?", de: "Wie stehst du zum Terminal?" },
    help: {
      en: "A mainstream desktop should not demand terminal confidence.",
      de: "Ein Mainstream-Desktop sollte keine Terminal-Sicherheit voraussetzen."
    },
    options: [
      option("avoid", "I want to avoid it", "Ich möchte es vermeiden"),
      option("guided", "Fine with clear guidance", "Mit klarer Anleitung okay"),
      option("comfortable", "Comfortable", "Sicher"),
      option("enthusiast", "I prefer it", "Ich bevorzuge es")
    ]
  },
  {
    field: "troubleshooting",
    group: "confidence",
    question: { en: "How much troubleshooting do you accept?", de: "Wie viel Fehlersuche akzeptierst du?" },
    help: {
      en: "This materially limits rolling and specialist recommendations.",
      de: "Das begrenzt Rolling- und Spezialempfehlungen deutlich."
    },
    options: [
      option("avoid", "Very little", "Sehr wenig"),
      option("guided", "Only with a clear guide", "Nur mit klarer Anleitung"),
      option("comfortable", "I can investigate issues", "Ich kann Probleme untersuchen"),
      option("enthusiast", "Troubleshooting is part of the fun", "Fehlersuche gehört für mich dazu")
    ]
  },
  {
    field: "maintenance",
    group: "maintenance",
    question: { en: "How much ongoing maintenance do you want?", de: "Wie viel laufende Wartung möchtest du?" },
    help: {
      en: "Low-maintenance users should stay near long-lived mainstream releases.",
      de: "Bei wenig Wartung sind langlebige Mainstream-Releases sinnvoller."
    },
    options: [
      option("minimal", "As little as possible", "So wenig wie möglich"),
      option("regular", "Normal scheduled updates", "Normale regelmäßige Updates"),
      option("active", "Frequent updates are fine", "Häufige Updates sind okay"),
      option("hobby", "Maintaining the system is a hobby", "Systempflege ist Teil meines Hobbys")
    ]
  },
  {
    field: "freshness",
    group: "maintenance",
    question: { en: "Stable base or newest software?", de: "Stabile Basis oder neueste Software?" },
    help: {
      en: "Newer packages often mean a faster change cadence.",
      de: "Neuere Pakete bedeuten meist schnellere Veränderungen."
    },
    options: [
      option("stable", "Prefer stability", "Stabilität bevorzugen"),
      option("balanced", "Balanced", "Ausgewogen"),
      option("newest", "Newest kernels and packages", "Neueste Kernel und Pakete")
    ]
  },
  {
    field: "rollingTolerance",
    group: "maintenance",
    question: { en: "Would you use a rolling release?", de: "Würdest du ein Rolling Release nutzen?" },
    help: {
      en: "A “no” is a real gate for Tumbleweed, CachyOS, Arch and Gentoo.",
      de: "Ein „Nein“ ist eine echte Grenze für Tumbleweed, CachyOS, Arch und Gentoo."
    },
    options: [
      option("no", "No", "Nein"),
      option("maybe", "Maybe, with safeguards", "Vielleicht, mit Sicherheitsnetz"),
      option("yes", "Yes", "Ja")
    ]
  },
  {
    field: "desktopPreference",
    group: "workflow",
    question: { en: "Which desktop direction appeals to you?", de: "Welche Desktop-Richtung spricht dich an?" },
    help: {
      en: "The desktop experience matters more than distro branding for many users.",
      de: "Für viele ist das Desktop-Erlebnis wichtiger als der Distributionsname."
    },
    options: [
      option("windows_like", "Familiar Windows-like layout", "Vertraute Windows-ähnliche Oberfläche"),
      option("kde", "KDE Plasma and customization", "KDE Plasma und Anpassbarkeit"),
      option("gnome", "GNOME and focused workflow", "GNOME und fokussierter Arbeitsablauf"),
      option("no_preference", "No preference", "Keine Präferenz"),
      option("build_my_own", "I want to assemble it myself", "Ich möchte alles selbst zusammenstellen")
    ]
  },
  {
    field: "windowsLikeUi",
    group: "workflow",
    question: { en: "How important is a familiar Windows-like workflow?", de: "Wie wichtig ist ein vertrauter Windows-ähnlicher Ablauf?" },
    help: {
      en: "This can move Mint and Zorin ahead of technically newer choices.",
      de: "Dadurch können Mint und Zorin vor technisch neueren Optionen liegen."
    },
    options: [
      option("important", "Very important", "Sehr wichtig"),
      option("nice", "Nice to have", "Wäre schön"),
      option("irrelevant", "I want something different", "Ich möchte etwas anderes")
    ]
  },
  {
    field: "gaming",
    group: "workflow",
    question: { en: "How important is gaming?", de: "Wie wichtig ist Gaming?" },
    help: {
      en: "Gaming adds verification work; it never selects a gaming distro alone.",
      de: "Gaming erzeugt Prüfbedarf; allein wählt es niemals eine Gaming-Distribution."
    },
    options: [
      option("none", "Not relevant", "Nicht relevant"),
      option("casual", "Occasional games", "Gelegentliche Spiele"),
      option("important", "Important", "Wichtig"),
      option("critical", "Top priority / performance tuning", "Höchste Priorität / Performance-Tuning")
    ]
  },
  {
    field: "office",
    group: "workflow",
    question: { en: "How demanding is your Office workflow?", de: "Wie anspruchsvoll ist dein Office-Arbeitsablauf?" },
    help: {
      en: "Macros, add-ins and exact document fidelity can become blockers.",
      de: "Makros, Add-ins und exakte Dokumenttreue können zu Blockern werden."
    },
    options: [
      option("none", "Not relevant", "Nicht relevant"),
      option("basic", "Basic documents and email", "Einfache Dokumente und E-Mail"),
      option("complex", "Complex files, macros or business integration", "Komplexe Dateien, Makros oder Geschäftsintegration")
    ]
  },
  {
    field: "development",
    group: "workflow",
    question: { en: "What development environment do you need?", de: "Welche Entwicklungsumgebung brauchst du?" },
    help: {
      en: "Cross-platform tools fit well; Microsoft-only stacks may need Windows.",
      de: "Plattformübergreifende Werkzeuge passen gut; Microsoft-only kann Windows erfordern."
    },
    options: [
      option("none", "No development", "Keine Entwicklung"),
      option("web", "Web / Linux-friendly tooling", "Web / Linux-freundliche Werkzeuge"),
      option("cross_platform", "Cross-platform development", "Plattformübergreifende Entwicklung"),
      option("microsoft_stack", "Full Visual Studio / Microsoft-only stack", "Volles Visual Studio / Microsoft-only")
    ]
  },
  {
    field: "creative",
    group: "workflow",
    question: { en: "How important is photography or creative work?", de: "Wie wichtig sind Fotografie oder Kreativarbeit?" },
    help: {
      en: "Professional Adobe workflows require application-level review.",
      de: "Professionelle Adobe-Abläufe müssen auf Anwendungsebene geprüft werden."
    },
    options: [
      option("none", "Not relevant", "Nicht relevant"),
      option("hobby", "Hobby", "Hobby"),
      option("professional", "Professional / colour-critical", "Professionell / farbkritisch")
    ]
  },
  {
    field: "mediaProduction",
    group: "workflow",
    question: { en: "Do you produce video or audio?", de: "Produzierst du Video oder Audio?" },
    help: {
      en: "Plugins, codecs, hardware and collaboration matter more than the editor name.",
      de: "Plugins, Codecs, Hardware und Zusammenarbeit sind wichtiger als der Editorname."
    },
    options: [
      option("none", "No", "Nein"),
      option("hobby", "Hobby", "Hobby"),
      option("professional", "Professional", "Professionell")
    ]
  },
  {
    field: "professionalDependencies",
    group: "workflow",
    question: { en: "Can professional Windows-only tools be replaced?", de: "Können professionelle Windows-only-Werkzeuge ersetzt werden?" },
    help: {
      en: "An essential unsupported workflow can correctly stop the migration.",
      de: "Ein unverzichtbarer, nicht unterstützter Ablauf kann den Umstieg zurecht stoppen."
    },
    options: [
      option("none", "No special dependency", "Keine besondere Abhängigkeit"),
      option("replaceable", "I can test alternatives", "Ich kann Alternativen testen"),
      option("essential", "No — exact tools/support are required", "Nein — exakte Werkzeuge/Support sind Pflicht")
    ]
  },
  {
    field: "gpuVendor",
    group: "hardware",
    question: { en: "Which graphics vendor is in this PC?", de: "Welcher Grafikanbieter steckt im Rechner?" },
    help: {
      en: "This changes driver and live-test guidance, not the distro family by itself.",
      de: "Das ändert Treiber- und Testhinweise, nicht allein die Distributionsfamilie."
    },
    options: [
      option("unknown", "I do not know", "Weiß ich nicht"),
      option("nvidia", "NVIDIA", "NVIDIA"),
      option("amd", "AMD", "AMD"),
      option("intel", "Intel", "Intel")
    ]
  },
  {
    field: "secureBoot",
    group: "hardware",
    question: { en: "Must Secure Boot remain enabled?", de: "Muss Secure Boot aktiviert bleiben?" },
    help: {
      en: "Third-party kernel modules may require a distro-specific signing path.",
      de: "Kernelmodule von Drittanbietern können einen distributionsspezifischen Signierweg benötigen."
    },
    options: [
      option("required", "Required", "Erforderlich"),
      option("preferred", "Preferred", "Bevorzugt"),
      option("irrelevant", "Not important", "Nicht wichtig")
    ]
  },
  {
    field: "proprietaryTolerance",
    group: "hardware",
    question: { en: "Will you use proprietary drivers/software when needed?", de: "Nutzt du bei Bedarf proprietäre Treiber/Software?" },
    help: {
      en: "NVIDIA plus “avoid” creates a real policy conflict to review.",
      de: "NVIDIA plus „vermeiden“ erzeugt einen echten Zielkonflikt."
    },
    options: [
      option("avoid", "Avoid if possible", "Wenn möglich vermeiden"),
      option("accept_if_needed", "Accept when needed", "Bei Bedarf akzeptieren"),
      option("comfortable", "Comfortable with it", "Damit bin ich einverstanden")
    ]
  },
  {
    field: "systemInterest",
    group: "confidence",
    question: { en: "What do you want from the system itself?", de: "Was möchtest du vom System selbst?" },
    help: {
      en: "This is the explicit gate for NixOS, Arch and Gentoo.",
      de: "Das ist die ausdrückliche Grenze für NixOS, Arch und Gentoo."
    },
    options: [
      option("use_it", "Use the computer, not build it", "Den Rechner nutzen, nicht bauen"),
      option("customize", "Customize the desktop", "Den Desktop stark anpassen"),
      option("declarative", "Declarative, reproducible system-as-code", "Deklaratives, reproduzierbares System-as-Code"),
      option("manual_build", "Assemble and learn every layer", "Jede Ebene selbst aufbauen und lernen"),
      option("compile_control", "Compile, tune and control everything", "Alles kompilieren, abstimmen und kontrollieren")
    ]
  },
  {
    field: "migrationMode",
    group: "hardware",
    question: { en: "What is your current migration goal?", de: "Was ist dein aktuelles Umstiegsziel?" },
    help: {
      en: "The safer next step changes between testing, dual boot and replacement.",
      de: "Der sichere nächste Schritt unterscheidet sich bei Test, Dual Boot und Ersatz."
    },
    options: [
      option("test", "Test Linux without installing", "Linux ohne Installation testen"),
      option("dual_boot", "Keep Windows and dual boot", "Windows behalten und Dual Boot"),
      option("replace", "Eventually replace Windows", "Windows später vollständig ersetzen")
    ]
  }
];

export const launcherOptions: Array<{
  id: GameLauncher;
  label: string;
}> = [
  { id: "steam", label: "Steam" },
  { id: "battlenet", label: "Battle.net" },
  { id: "epic", label: "Epic Games" },
  { id: "xbox", label: "Xbox app / PC Game Pass" },
  { id: "ea", label: "EA app" },
  { id: "ubisoft", label: "Ubisoft Connect" },
  { id: "riot", label: "Riot / Vanguard" },
  { id: "vr", label: "VR / specialized peripherals" }
];

export const launcherQuestion: {
  question: LocalizedText;
  help: LocalizedText;
} = {
  question: {
    en: "Which gaming ecosystems must you verify?",
    de: "Welche Gaming-Ökosysteme musst du prüfen?"
  },
  help: {
    en: "Availability of Steam does not prove that a title, anti-cheat system or launcher works.",
    de: "Steam-Verfügbarkeit beweist nicht, dass Spiel, Anti-Cheat oder Launcher funktionieren."
  }
};

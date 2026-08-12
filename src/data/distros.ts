import type { DistroProfile } from "../domain/types";

export const distros: DistroProfile[] = [
  {
    id: "linux-mint-cinnamon",
    name: "Linux Mint",
    edition: "22.3 Cinnamon",
    category: "mainstream",
    supportDepth: "guided",
    summary: {
      en: "Familiar, conservative desktop for people who want to migrate rather than maintain a hobby OS.",
      de: "Vertrauter, konservativer Desktop für Menschen, die umsteigen und nicht ständig das System pflegen möchten."
    },
    maintenance: {
      en: "Low. Long-lived base and graphical update/driver tools.",
      de: "Gering. Langlebige Basis und grafische Update-/Treiberwerkzeuge."
    },
    desktop: {
      en: "Cinnamon, with a familiar panel and application menu.",
      de: "Cinnamon mit vertrauter Leiste und Anwendungsmenü."
    },
    releaseModel: "lts",
    officialHome: "https://linuxmint.com/",
    downloadUrl: "https://linuxmint.com/download.php",
    verifyUrl: "https://linuxmint-installation-guide.readthedocs.io/en/latest/verify.html",
    installUrl: "https://linuxmint-installation-guide.readthedocs.io/en/latest/",
    mediaTool: "rufus_or_etcher",
    reviewedAt: "2026-08-11"
  },
  {
    id: "zorin-os",
    name: "Zorin OS",
    edition: "18.1 Core",
    category: "mainstream",
    supportDepth: "guided",
    summary: {
      en: "Polished Windows-migrant experience with a familiar layout. The free Core edition is sufficient for this recommendation.",
      de: "Polierter Einstieg für Windows-Umsteiger mit vertrauter Oberfläche. Für diese Empfehlung reicht die kostenlose Core-Edition."
    },
    maintenance: {
      en: "Low. Ubuntu LTS base; distinguish free Core from paid Pro without upselling.",
      de: "Gering. Ubuntu-LTS-Basis; kostenlose Core- und kostenpflichtige Pro-Edition ohne Verkaufsdruck unterscheiden."
    },
    desktop: {
      en: "Customized GNOME desktop with familiar layout options.",
      de: "Angepasster GNOME-Desktop mit vertrauten Layout-Optionen."
    },
    releaseModel: "lts",
    officialHome: "https://zorin.com/os/",
    downloadUrl: "https://zorin.com/os/download/",
    verifyUrl: "https://help.zorin.com/docs/getting-started/check-the-integrity-of-your-copy-of-zorin-os/",
    installUrl: "https://help.zorin.com/docs/getting-started/install-zorin-os/",
    mediaTool: "rufus_or_etcher",
    reviewedAt: "2026-08-11"
  },
  {
    id: "ubuntu-lts",
    name: "Ubuntu",
    edition: "26.04 LTS",
    category: "mainstream",
    supportDepth: "guided",
    summary: {
      en: "Mainstream reference choice with broad documentation and third-party support.",
      de: "Mainstream-Referenz mit umfangreicher Dokumentation und breiter Unterstützung durch Drittanbieter."
    },
    maintenance: {
      en: "Low to moderate. LTS base, with Snap and Ubuntu-specific design choices to understand.",
      de: "Gering bis mittel. LTS-Basis; Snap und Ubuntu-spezifische Designentscheidungen sollten bekannt sein."
    },
    desktop: {
      en: "GNOME-based Ubuntu Desktop; intentionally different from Windows.",
      de: "GNOME-basierter Ubuntu-Desktop; bewusst anders als Windows."
    },
    releaseModel: "lts",
    officialHome: "https://ubuntu.com/desktop",
    downloadUrl: "https://ubuntu.com/download/desktop",
    verifyUrl: "https://discourse.ubuntu.com/t/how-to-verify-your-ubuntu-download/14010",
    installUrl: "https://documentation.ubuntu.com/desktop/en/latest/tutorial/install-ubuntu-desktop/",
    mediaTool: "rufus_or_etcher",
    reviewedAt: "2026-08-11"
  },
  {
    id: "fedora-kde",
    name: "Fedora KDE",
    edition: "44",
    category: "mainstream",
    supportDepth: "guided",
    summary: {
      en: "Modern KDE option with current Linux technology and a faster release cadence.",
      de: "Moderne KDE-Option mit aktueller Linux-Technik und schnellerem Release-Zyklus."
    },
    maintenance: {
      en: "Moderate. Regular releases and upgrades; some codecs and third-party software need explicit choices.",
      de: "Mittel. Regelmäßige Releases und Upgrades; einige Codecs und Drittanbieter-Pakete erfordern bewusste Entscheidungen."
    },
    desktop: {
      en: "KDE Plasma with extensive graphical customization.",
      de: "KDE Plasma mit umfangreicher grafischer Anpassbarkeit."
    },
    releaseModel: "rapid",
    officialHome: "https://fedoraproject.org/kde/",
    downloadUrl: "https://fedoraproject.org/kde/download/",
    verifyUrl: "https://fedoraproject.org/security/",
    installUrl: "https://docs.fedoraproject.org/en-US/fedora-kde/",
    mediaTool: "fedora_media_writer",
    reviewedAt: "2026-08-11"
  },
  {
    id: "debian-kde",
    name: "Debian",
    edition: "13 KDE Live",
    category: "mainstream",
    supportDepth: "guided",
    summary: {
      en: "Conservative community distribution with a live KDE option; stable does not automatically mean beginner-oriented.",
      de: "Konservative Community-Distribution mit KDE-Live-Option; stabil bedeutet nicht automatisch einsteigerfreundlich."
    },
    maintenance: {
      en: "Low after setup, but installation, firmware and repository choices can require more context.",
      de: "Nach der Einrichtung gering; Installation, Firmware und Paketquellen können mehr Hintergrundwissen verlangen."
    },
    desktop: {
      en: "KDE Plasma on Debian stable.",
      de: "KDE Plasma auf Debian Stable."
    },
    releaseModel: "stable",
    officialHome: "https://www.debian.org/",
    downloadUrl: "https://www.debian.org/CD/live/",
    verifyUrl: "https://www.debian.org/CD/verify",
    installUrl: "https://www.debian.org/releases/stable/installmanual",
    mediaTool: "rufus_or_etcher",
    reviewedAt: "2026-08-11"
  },
  {
    id: "opensuse-tumbleweed-kde",
    name: "openSUSE Tumbleweed",
    edition: "KDE",
    category: "mainstream",
    supportDepth: "guided",
    summary: {
      en: "Continuously updated KDE system for users who explicitly accept a rolling release.",
      de: "Kontinuierlich aktualisiertes KDE-System für Menschen, die ein Rolling Release ausdrücklich akzeptieren."
    },
    maintenance: {
      en: "Active. Frequent updates; snapshots and YaST help, but rolling-release tolerance is required.",
      de: "Aktiv. Häufige Updates; Snapshots und YaST helfen, Rolling-Release-Toleranz bleibt Pflicht."
    },
    desktop: {
      en: "Current KDE Plasma with strong system administration tooling.",
      de: "Aktuelles KDE Plasma mit umfangreichen Verwaltungswerkzeugen."
    },
    releaseModel: "rolling",
    officialHome: "https://get.opensuse.org/tumbleweed/",
    downloadUrl: "https://get.opensuse.org/tumbleweed/",
    verifyUrl: "https://en.opensuse.org/SDB:Download_help",
    installUrl: "https://doc.opensuse.org/documentation/tumbleweed/",
    mediaTool: "official_guidance",
    reviewedAt: "2026-08-11"
  },
  {
    id: "cachyos",
    name: "CachyOS",
    edition: "Desktop",
    category: "gaming",
    supportDepth: "reference",
    summary: {
      en: "Arch-based performance-focused system for experienced users who want current kernels, packages and tuning.",
      de: "Arch-basiertes, performanceorientiertes System für Erfahrene, die aktuelle Kernel, Pakete und Tuning möchten."
    },
    maintenance: {
      en: "Active rolling maintenance. Gaming alone is not sufficient reason to choose it.",
      de: "Aktive Rolling-Wartung. Gaming allein ist kein ausreichender Grund für diese Wahl."
    },
    desktop: {
      en: "Multiple choices; KDE is a common desktop path.",
      de: "Mehrere Optionen; KDE ist ein verbreiteter Desktop-Weg."
    },
    releaseModel: "rolling",
    officialHome: "https://cachyos.org/",
    downloadUrl: "https://cachyos.org/download",
    verifyUrl: "https://wiki.cachyos.org/installation/download/",
    installUrl: "https://wiki.cachyos.org/installation/installation_on_root/",
    mediaTool: "official_guidance",
    reviewedAt: "2026-08-11"
  },
  {
    id: "nobara",
    name: "Nobara Linux",
    edition: "Official / KDE",
    category: "gaming",
    supportDepth: "reference",
    summary: {
      en: "Fedora-derived project with gaming, streaming and content-creation changes preconfigured.",
      de: "Fedora-abgeleitetes Projekt mit vorkonfigurierten Änderungen für Gaming, Streaming und Content Creation."
    },
    maintenance: {
      en: "Moderate to active. Project-specific changes and support expectations differ from Fedora.",
      de: "Mittel bis aktiv. Projektspezifische Änderungen und Support-Erwartungen unterscheiden sich von Fedora."
    },
    desktop: {
      en: "Project editions include its official desktop and KDE/GNOME variants.",
      de: "Projekt-Editionen umfassen den offiziellen Desktop sowie KDE-/GNOME-Varianten."
    },
    releaseModel: "rapid",
    officialHome: "https://nobaraproject.org/",
    downloadUrl: "https://nobaraproject.org/download.html",
    verifyUrl: "https://wiki.nobaraproject.org/FAQ/FAQ",
    installUrl: "https://wiki.nobaraproject.org/en/new-user-guide-general-guidelines",
    mediaTool: "official_guidance",
    reviewedAt: "2026-08-11"
  },
  {
    id: "nixos",
    name: "NixOS",
    edition: "26.05",
    category: "advanced",
    supportDepth: "experimental",
    summary: {
      en: "Declarative, reproducible system for people who explicitly want configuration-as-code and a different system model.",
      de: "Deklaratives, reproduzierbares System für Menschen, die ausdrücklich Configuration-as-Code und ein anderes Systemmodell möchten."
    },
    maintenance: {
      en: "Advanced. Learning the Nix language and system model is part of adoption.",
      de: "Fortgeschritten. Nix-Sprache und Systemmodell gehören zum Umstieg."
    },
    desktop: {
      en: "User-selected; desktop configuration is declarative.",
      de: "Frei wählbar; Desktop-Konfiguration erfolgt deklarativ."
    },
    releaseModel: "stable",
    officialHome: "https://nixos.org/",
    downloadUrl: "https://nixos.org/download/",
    verifyUrl: "https://nixos.org/download/",
    installUrl: "https://nixos.org/manual/nixos/stable/",
    mediaTool: "official_guidance",
    reviewedAt: "2026-08-11"
  },
  {
    id: "arch-linux",
    name: "Arch Linux",
    category: "advanced",
    supportDepth: "reference",
    summary: {
      en: "Manual rolling system for experienced users who want to assemble, learn and own each layer.",
      de: "Manuelles Rolling-System für Erfahrene, die jede Ebene selbst aufbauen, lernen und verantworten möchten."
    },
    maintenance: {
      en: "Active. Read current news, understand changes and troubleshoot.",
      de: "Aktiv. Aktuelle Hinweise lesen, Änderungen verstehen und Fehler selbst untersuchen."
    },
    desktop: {
      en: "None selected by default; the user builds the environment.",
      de: "Keiner vorgegeben; die Umgebung wird selbst aufgebaut."
    },
    releaseModel: "rolling",
    officialHome: "https://archlinux.org/",
    downloadUrl: "https://archlinux.org/download/",
    verifyUrl: "https://archlinux.org/download/",
    installUrl: "https://wiki.archlinux.org/title/Installation_guide",
    mediaTool: "official_guidance",
    reviewedAt: "2026-08-11"
  },
  {
    id: "gentoo",
    name: "Gentoo Linux",
    category: "expert",
    supportDepth: "reference",
    summary: {
      en: "Expert/full-control system for people who want to build, understand and tune the machine rather than merely use it.",
      de: "Experten-/Vollkontrollsystem für Menschen, die den Rechner aufbauen, verstehen und abstimmen statt ihn nur zu benutzen."
    },
    maintenance: {
      en: "High. Compilation, USE flags, documentation and manual administration are the point.",
      de: "Hoch. Kompilierung, USE-Flags, Dokumentation und manuelle Administration sind hier Teil des Ziels."
    },
    desktop: {
      en: "Entirely user-assembled.",
      de: "Vollständig selbst zusammengestellt."
    },
    releaseModel: "rolling",
    officialHome: "https://www.gentoo.org/",
    downloadUrl: "https://www.gentoo.org/downloads/",
    verifyUrl: "https://wiki.gentoo.org/wiki/Handbook:AMD64/Full/Installation/Media",
    installUrl: "https://wiki.gentoo.org/wiki/Handbook:AMD64",
    mediaTool: "official_guidance",
    reviewedAt: "2026-08-11"
  }
];

export const distroById = new Map(distros.map((distro) => [distro.id, distro]));

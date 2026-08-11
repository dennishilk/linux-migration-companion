import type { LocalizedText } from "../domain/types";

export interface DistroComparisonProfile {
  nvidia: LocalizedText;
  gaming: LocalizedText;
  ecosystem: LocalizedText;
  beginner: LocalizedText;
  troubleshooting: LocalizedText;
  installation: LocalizedText;
  recovery: LocalizedText;
}

const text = (en: string, de: string): LocalizedText => ({ en, de });

export const distroComparisonById: Record<string, DistroComparisonProfile> = {
  "linux-mint-cinnamon": {
    nvidia: text("Graphical supported-driver workflow; exact GPU, Secure Boot and display behaviour still require verification.", "Grafischer, unterstützter Treiberweg; konkrete GPU, Secure Boot und Displayverhalten müssen trotzdem geprüft werden."),
    gaming: text("Mainstream Steam/Proton path without claiming title compatibility.", "Mainstream-Weg für Steam/Proton ohne Behauptung zur Titelkompatibilität."),
    ecosystem: text("Ubuntu LTS base plus Mint documentation and a broad third-party package ecosystem.", "Ubuntu-LTS-Basis plus Mint-Dokumentation und breites Drittanbieter-Paketökosystem."),
    beginner: text("High for users wanting a familiar desktop and low maintenance.", "Hoch für Nutzer mit Wunsch nach vertrautem Desktop und wenig Wartung."),
    troubleshooting: text("Usually guided graphical tools first; upstream Ubuntu guidance may also apply.", "Meist zuerst geführte grafische Werkzeuge; zusätzlich kann Ubuntu-Dokumentation gelten."),
    installation: text("Graphical installer; disk choices remain powerful and outside this Companion.", "Grafischer Installer; Datenträgerentscheidungen bleiben mächtig und außerhalb dieses Companions."),
    recovery: text("Timeshift-style system snapshots can help when configured; they are not a file backup.", "System-Snapshots wie Timeshift können bei korrekter Einrichtung helfen; sie sind kein Dateibackup.")
  },
  "zorin-os": {
    nvidia: text("Ubuntu-based supported-driver route with polished onboarding; verify Secure Boot and external displays.", "Ubuntu-basierter unterstützter Treiberweg mit poliertem Einstieg; Secure Boot und externe Displays prüfen."),
    gaming: text("Suitable mainstream test path; Zorin branding does not prove individual games.", "Geeigneter Mainstream-Testweg; Zorin-Branding beweist keine einzelnen Spiele."),
    ecosystem: text("Ubuntu LTS software ecosystem with Zorin-specific desktop guidance.", "Ubuntu-LTS-Softwareökosystem mit Zorin-spezifischer Desktop-Anleitung."),
    beginner: text("High, especially when a familiar Windows-like layout matters.", "Hoch, besonders wenn eine vertraute Windows-ähnliche Oberfläche wichtig ist."),
    troubleshooting: text("Graphical first; smaller project-specific knowledge base than Ubuntu itself.", "Zuerst grafisch; kleinere projektspezifische Wissensbasis als Ubuntu selbst."),
    installation: text("Graphical installer and onboarding; Core is sufficient, Pro is not required by this advisor.", "Grafischer Installer und Einstieg; Core genügt, Pro wird von diesem Berater nicht verlangt."),
    recovery: text("Use explicit backups and reviewed snapshot tooling; no recovery claim is inferred from the edition.", "Explizite Backups und geprüftes Snapshot-Werkzeug nutzen; aus der Edition wird keine Recovery-Garantie abgeleitet.")
  },
  "ubuntu-lts": {
    nvidia: text("Documented additional-driver path and broad vendor attention; verify module signing when Secure Boot matters.", "Dokumentierter Weg für zusätzliche Treiber und breite Herstellerbeachtung; Modulsignierung bei Secure Boot prüfen."),
    gaming: text("Broad mainstream package/documentation route; Snap and repository choices should be understood.", "Breiter Mainstream-Weg für Pakete/Dokumentation; Snap- und Paketquellenentscheidungen sollten verstanden werden."),
    ecosystem: text("Largest mainstream documentation and third-party support footprint in this comparison.", "Größter Mainstream-Umfang an Dokumentation und Drittanbieterunterstützung in diesem Vergleich."),
    beginner: text("High with willingness to learn Ubuntu's GNOME-based workflow.", "Hoch bei Bereitschaft, den GNOME-basierten Ubuntu-Ablauf zu lernen."),
    troubleshooting: text("Extensive official and community material, but advice must match the current LTS release.", "Umfangreiche offizielle und Community-Dokumentation; Hinweise müssen zur aktuellen LTS-Version passen."),
    installation: text("Graphical installer with documented paths; partition and encryption choices remain user-controlled.", "Grafischer Installer mit dokumentierten Wegen; Partitionierung und Verschlüsselung bleiben in Nutzerhand."),
    recovery: text("LTS reduces change cadence; backups and snapshots still need deliberate setup.", "LTS reduziert den Änderungsrhythmus; Backups und Snapshots müssen trotzdem bewusst eingerichtet werden.")
  },
  "fedora-kde": {
    nvidia: text("Requires an explicit third-party driver decision; Secure Boot and kernel updates deserve current documentation.", "Erfordert eine bewusste Drittanbieter-Treiberentscheidung; Secure Boot und Kernelupdates brauchen aktuelle Dokumentation."),
    gaming: text("Current graphics stack is attractive, but codecs, repositories and game support remain explicit checks.", "Aktueller Grafik-Stack ist attraktiv; Codecs, Paketquellen und Spieleunterstützung bleiben ausdrückliche Prüfungen."),
    ecosystem: text("Strong Fedora documentation and current packages; a shorter release lifecycle than LTS systems.", "Starke Fedora-Dokumentation und aktuelle Pakete; kürzerer Release-Zyklus als LTS-Systeme."),
    beginner: text("Moderate: polished KDE, but faster upgrades and third-party choices require attention.", "Mittel: poliertes KDE, aber schnellere Upgrades und Drittanbieterentscheidungen verlangen Aufmerksamkeit."),
    troubleshooting: text("Good official documentation; release-specific answers matter because the stack moves quickly.", "Gute offizielle Dokumentation; versionsgenaue Antworten sind wegen des schnellen Stacks wichtig."),
    installation: text("Graphical installer; review storage and third-party repository decisions rather than accepting defaults blindly.", "Grafischer Installer; Speicher- und Drittanbieterentscheidungen prüfen statt Defaults blind zu übernehmen."),
    recovery: text("Btrfs is commonly used, but usable rollback is not assumed unless snapshot tooling is configured and tested.", "Btrfs wird häufig genutzt; brauchbarer Rollback wird ohne eingerichtetes und geprüftes Snapshot-Werkzeug nicht angenommen.")
  },
  "debian-kde": {
    nvidia: text("Supported non-free firmware/driver paths exist, but exact setup can require more manual context.", "Unterstützte Wege für nichtfreie Firmware/Treiber existieren, können aber mehr manuellen Kontext erfordern."),
    gaming: text("Conservative base; newer hardware or gaming stacks may need deliberate repository decisions.", "Konservative Basis; neuere Hardware oder Gaming-Stacks können bewusste Paketquellenentscheidungen erfordern."),
    ecosystem: text("Large upstream community and documentation, with stability prioritized over newest desktop packages.", "Große Upstream-Community und Dokumentation, mit Stabilität statt neuester Desktoppakete als Priorität."),
    beginner: text("Moderate to low without guidance; stable does not automatically mean beginner-oriented.", "Mittel bis gering ohne Anleitung; stabil bedeutet nicht automatisch einsteigerfreundlich."),
    troubleshooting: text("Excellent manuals, but users may need to understand firmware, repositories and Debian terminology.", "Sehr gute Handbücher; Nutzer müssen eventuell Firmware, Paketquellen und Debian-Begriffe verstehen."),
    installation: text("Live KDE route is approachable; installer and firmware choices still deserve careful review.", "KDE-Live-Weg ist zugänglich; Installer- und Firmwareentscheidungen müssen dennoch sorgfältig geprüft werden."),
    recovery: text("Conservative updates reduce churn; snapshot/rollback remains an explicit user design.", "Konservative Updates reduzieren Änderungen; Snapshot/Rollback bleibt eine bewusste Nutzerentscheidung.")
  },
  "opensuse-tumbleweed-kde": {
    nvidia: text("Documented repository route, but rolling kernels and proprietary modules require active attention.", "Dokumentierter Paketquellenweg; Rolling-Kernel und proprietäre Module verlangen jedoch aktive Aufmerksamkeit."),
    gaming: text("Current graphics and KDE stack; frequent updates are part of the bargain, not a hidden detail.", "Aktueller Grafik- und KDE-Stack; häufige Updates sind Teil des Modells, kein verstecktes Detail."),
    ecosystem: text("Strong YaST/openSUSE tooling and documentation with a smaller third-party footprint than Ubuntu.", "Starke YaST-/openSUSE-Werkzeuge und Dokumentation, mit kleinerem Drittanbieterumfang als Ubuntu."),
    beginner: text("Moderate only when rolling maintenance is explicitly accepted.", "Mittel nur bei ausdrücklich akzeptierter Rolling-Wartung."),
    troubleshooting: text("Good administration tools; snapshot and repository concepts still need understanding.", "Gute Verwaltungswerkzeuge; Snapshot- und Paketquellenkonzepte müssen trotzdem verstanden werden."),
    installation: text("Powerful graphical installer with many choices; more decisions than a minimal beginner path.", "Leistungsfähiger grafischer Installer mit vielen Optionen; mehr Entscheidungen als bei einem minimalen Einsteigerweg."),
    recovery: text("Btrfs/Snapper rollback is a major strength when the installed layout supports and tests it; still not a data backup.", "Btrfs-/Snapper-Rollback ist bei passendem und geprüftem Layout eine Stärke; dennoch kein Datenbackup.")
  },
  cachyos: {
    nvidia: text("Project tooling may simplify setup, but Arch-based rolling maintenance and real GPU tests remain mandatory.", "Projektwerkzeuge können die Einrichtung erleichtern; Arch-basierte Rolling-Wartung und echte GPU-Tests bleiben Pflicht."),
    gaming: text("Performance-oriented defaults for an experienced user; no benchmark or game compatibility is inferred.", "Performanceorientierte Defaults für Erfahrene; keine Benchmark- oder Spielekompatibilität wird daraus abgeleitet."),
    ecosystem: text("CachyOS wiki plus Arch ecosystem, with project-specific packages and support boundaries.", "CachyOS-Wiki plus Arch-Ökosystem, mit projektspezifischen Paketen und Supportgrenzen."),
    beginner: text("Low. Gaming alone never passes the specialist gate.", "Gering. Gaming allein überwindet niemals das Spezialisten-Gate."),
    troubleshooting: text("Active ownership of rolling updates, package changes and recovery is expected.", "Aktive Verantwortung für Rolling-Updates, Paketänderungen und Wiederherstellung wird erwartet."),
    installation: text("Graphical project installer, but the resulting system remains an actively maintained rolling system.", "Grafischer Projektinstaller; das resultierende System bleibt ein aktiv gepflegtes Rolling-System."),
    recovery: text("Snapshot options depend on selected filesystem and installer choices; verify them rather than assuming rollback.", "Snapshot-Optionen hängen von Dateisystem und Installerwahl ab; Rollback prüfen statt annehmen.")
  },
  nobara: {
    nvidia: text("Project-specific driver/media choices can help a target workflow; they also create project-specific support expectations.", "Projektspezifische Treiber-/Medienentscheidungen können helfen, erzeugen aber eigene Support-Erwartungen."),
    gaming: text("Gaming and creation changes are preconfigured, but every title, anti-cheat and peripheral remains evidence work.", "Gaming- und Creation-Anpassungen sind vorkonfiguriert; jeder Titel, Anti-Cheat und jedes Gerät bleibt Evidenzarbeit."),
    ecosystem: text("Fedora-derived, not interchangeable with Fedora support instructions or lifecycle promises.", "Fedora-abgeleitet, aber nicht austauschbar mit Fedora-Supporthinweisen oder Lebenszykluszusagen."),
    beginner: text("Low to moderate; project-specific changes are not automatically safer than mainstream Fedora or Mint.", "Gering bis mittel; projektspezifische Änderungen sind nicht automatisch sicherer als Fedora oder Mint."),
    troubleshooting: text("Use Nobara's own guidance first and understand where Fedora instructions do not apply.", "Zuerst Nobaras eigene Hinweise nutzen und verstehen, wo Fedora-Anleitungen nicht gelten."),
    installation: text("Project installer and opinionated defaults; suitable only when those choices match the user.", "Projektinstaller und meinungsstarke Defaults; nur geeignet, wenn diese Entscheidungen zum Nutzer passen."),
    recovery: text("No generic rollback guarantee is inferred; configure backups and verify the actual filesystem/snapshot setup.", "Keine allgemeine Rollback-Garantie; Backups einrichten und tatsächliches Dateisystem-/Snapshot-Setup prüfen.")
  },
  nixos: {
    nvidia: text("Declarative driver configuration is powerful but requires NixOS-specific knowledge and real hardware verification.", "Deklarative Treiberkonfiguration ist mächtig, verlangt aber NixOS-Wissen und echte Hardwareprüfung."),
    gaming: text("Possible with explicit configuration; not a minimal-effort gaming recommendation.", "Mit bewusster Konfiguration möglich; keine Gaming-Empfehlung für minimalen Aufwand."),
    ecosystem: text("Distinct Nix language, module system and package ecosystem; generic Linux instructions often need translation.", "Eigenständige Nix-Sprache, Modul- und Paketwelt; allgemeine Linux-Anleitungen müssen oft übertragen werden."),
    beginner: text("Low unless learning declarative system management is the actual goal.", "Gering, außer das Lernen deklarativer Systemverwaltung ist selbst das Ziel."),
    troubleshooting: text("Requires reading evaluation errors, module options and NixOS-specific documentation.", "Erfordert das Lesen von Auswertungsfehlern, Moduloptionen und NixOS-spezifischer Dokumentation."),
    installation: text("Installation and configuration are a different system model; this Companion generates no disk or hardware config.", "Installation und Konfiguration folgen einem anderen Systemmodell; dieser Companion erzeugt keine Datenträger- oder Hardwarekonfiguration."),
    recovery: text("System generations provide strong rollback semantics; user data and secrets still need separate backup.", "Systemgenerationen bieten starke Rollback-Eigenschaften; Nutzerdaten und Geheimnisse benötigen trotzdem ein getrenntes Backup.")
  },
  "arch-linux": {
    nvidia: text("Manual package, initramfs and update ownership; current Arch documentation is required.", "Manuelle Verantwortung für Pakete, Initramfs und Updates; aktuelle Arch-Dokumentation ist Pflicht."),
    gaming: text("Current packages and broad flexibility for users who accept manual maintenance; no automatic compatibility benefit.", "Aktuelle Pakete und hohe Flexibilität für Nutzer mit manueller Wartungsbereitschaft; kein automatischer Kompatibilitätsvorteil."),
    ecosystem: text("Excellent ArchWiki and AUR breadth, with community packaging risk that must be reviewed.", "Sehr gutes ArchWiki und breite AUR-Auswahl, mit zu prüfendem Risiko von Community-Paketen."),
    beginner: text("Low. Manual-build intent and competence are hard gates.", "Gering. Absicht zum manuellen Aufbau und Kompetenz sind harte Gates."),
    troubleshooting: text("Users are expected to read news, understand changes and repair their own configuration.", "Nutzer sollen News lesen, Änderungen verstehen und die eigene Konfiguration reparieren."),
    installation: text("Manual installation reference; helpers do not remove ongoing ownership.", "Manuelle Installationsreferenz; Hilfsprogramme entfernen nicht die laufende Eigenverantwortung."),
    recovery: text("Entirely user-designed through filesystem, snapshots, package cache and backups.", "Vollständig vom Nutzer über Dateisystem, Snapshots, Paketcache und Backups zu gestalten.")
  },
  gentoo: {
    nvidia: text("Kernel, driver and userspace integration are expert-owned; no beginner driver path is promised.", "Kernel-, Treiber- und Userspace-Integration liegen beim Experten; kein Einsteiger-Treiberweg wird versprochen."),
    gaming: text("Maximum control can serve a specialist, but compilation/control—not a gaming checkbox—is the reason to choose it.", "Maximale Kontrolle kann Spezialisten dienen; Kompilierung/Kontrolle, nicht ein Gaming-Häkchen, ist der Grund."),
    ecosystem: text("Gentoo Handbook, wiki, Portage and USE-flag model; substantial local decision ownership.", "Gentoo-Handbook, Wiki, Portage und USE-Flag-Modell; umfangreiche lokale Eigenverantwortung."),
    beginner: text("None. The complete expert/compile-control persona is required.", "Keine. Das vollständige Experten-/Compile-Control-Profil ist erforderlich."),
    troubleshooting: text("Reading build logs, dependency choices, kernel configuration and upstream documentation is normal work.", "Build-Logs, Abhängigkeiten, Kernelkonfiguration und Upstream-Dokumentation zu lesen ist normaler Arbeitsalltag."),
    installation: text("Handbook-driven manual build; patience and recovery competence are prerequisites.", "Handbuchgetriebener manueller Aufbau; Geduld und Wiederherstellungskompetenz sind Voraussetzungen."),
    recovery: text("User-designed backups, binary/package strategy and filesystem snapshots; nothing is assumed.", "Vom Nutzer entworfene Backups, Binär-/Paketstrategie und Dateisystem-Snapshots; nichts wird angenommen.")
  }
};

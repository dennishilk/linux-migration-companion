import { distros } from "../data/distros";
import type {
  AdvisorAnswers,
  DistroRecommendation,
  LocalizedText,
  RecommendationTier
} from "../domain/types";

const experienceValue: Record<AdvisorAnswers["experience"], number> = {
  none: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4
};

const comfortValue: Record<AdvisorAnswers["terminalComfort"], number> = {
  avoid: 0,
  guided: 1,
  comfortable: 2,
  enthusiast: 3
};

const maintenanceValue: Record<AdvisorAnswers["maintenance"], number> = {
  minimal: 0,
  regular: 1,
  active: 2,
  hobby: 3
};

const baseScores: Record<string, number> = {
  "linux-mint-cinnamon": 9,
  "zorin-os": 9,
  "ubuntu-lts": 8,
  kubuntu: 8,
  "pop-os": 8,
  "fedora-kde": 7,
  "debian-kde": 6,
  "opensuse-tumbleweed-kde": 4,
  cachyos: 3,
  nobara: 4,
  bazzite: 4,
  "void-linux": 2,
  endeavouros: 3,
  nixos: 1,
  "arch-linux": 1,
  gentoo: 0
};

function message(en: string, de: string): LocalizedText {
  return { en, de };
}

function scoreTier(score: number): RecommendationTier {
  if (score >= 20) return "strong";
  if (score >= 13) return "possible";
  if (score >= 7) return "exploratory";
  return "not_recommended";
}

const tierOrder: Record<RecommendationTier, number> = {
  strong: 3,
  possible: 2,
  exploratory: 1,
  not_recommended: 0
};

function capTier(
  tier: RecommendationTier,
  maximum: RecommendationTier
): RecommendationTier {
  return tierOrder[tier] > tierOrder[maximum] ? maximum : tier;
}

function scoreOne(
  distroId: string,
  answers: AdvisorAnswers
): Omit<DistroRecommendation, "distro"> {
  let score = baseScores[distroId] ?? 0;
  const reasons: LocalizedText[] = [];
  const tradeoffs: LocalizedText[] = [];
  const causedBy: LocalizedText[] = [];
  const changeFactors: LocalizedText[] = [];
  let maximumTier: RecommendationTier = "strong";

  const exp = experienceValue[answers.experience];
  const terminal = comfortValue[answers.terminalComfort];
  const troubleshoot = comfortValue[answers.troubleshooting];
  const maintenance = maintenanceValue[answers.maintenance];
  const isBeginner = exp <= 1;
  const acceptsRolling = answers.rollingTolerance === "yes";
  const rollingMaybe = answers.rollingTolerance === "maybe";

  const isMint = distroId === "linux-mint-cinnamon";
  const isZorin = distroId === "zorin-os";
  const isUbuntu = distroId === "ubuntu-lts";
  const isKubuntu = distroId === "kubuntu";
  const isPop = distroId === "pop-os";
  const isFedora = distroId === "fedora-kde";
  const isDebian = distroId === "debian-kde";
  const isTumbleweed = distroId === "opensuse-tumbleweed-kde";
  const isCachy = distroId === "cachyos";
  const isNobara = distroId === "nobara";
  const isBazzite = distroId === "bazzite";
  const isVoid = distroId === "void-linux";
  const isEndeavour = distroId === "endeavouros";
  const isNix = distroId === "nixos";
  const isArch = distroId === "arch-linux";
  const isGentoo = distroId === "gentoo";
  const isMainstream =
    isMint || isZorin || isUbuntu || isKubuntu || isPop || isFedora || isDebian;
  const isRolling =
    isTumbleweed || isCachy || isVoid || isEndeavour || isArch || isGentoo;
  const isSpecialistRolling = isCachy || isVoid || isEndeavour || isArch || isGentoo;
  const advancedRollingReady =
    exp >= 3 && terminal >= 2 && troubleshoot >= 2 && maintenance >= 2 && acceptsRolling;
  const manualAssemblyIntent =
    answers.systemInterest === "manual_build" ||
    answers.systemInterest === "compile_control" ||
    answers.desktopPreference === "build_my_own";

  if (isBeginner) {
    if (isMint || isZorin) score += 6;
    if (isUbuntu || isKubuntu) score += 4;
    if (isPop) score += 3;
    if (isFedora) score += 2;
    if (isDebian) score += 1;
    if (isTumbleweed) score -= 3;
    if (isCachy || isNobara) score -= 5;
    if (isBazzite) score -= 3;
    if (isNix || isArch || isVoid || isEndeavour) score -= 8;
    if (isGentoo) score -= 12;
    if (isMint || isZorin || isUbuntu || isKubuntu || isPop) {
      reasons.push(
        message(
          "Its supported graphical path matches limited Linux experience.",
          "Der unterstützte grafische Weg passt zu geringer Linux-Erfahrung."
        )
      );
    }
    causedBy.push(
      message(
        "You selected little or no Linux experience.",
        "Du hast wenig oder keine Linux-Erfahrung angegeben."
      )
    );
  } else if (exp >= 3) {
    if (isFedora || isTumbleweed) score += 2;
    if (isBazzite) score += 1;
    if (isNix || isArch || isVoid || isEndeavour) score += 3;
    if (isGentoo) score += 2;
    causedBy.push(
      message(
        "Your Linux experience permits more advanced options.",
        "Deine Linux-Erfahrung erlaubt fortgeschrittenere Optionen."
      )
    );
  }

  if (terminal === 0) {
    if (isMint || isZorin) score += 3;
    if (isUbuntu || isKubuntu || isPop || isFedora) score += 2;
    if (isNix || isArch || isVoid || isEndeavour) score -= 5;
    if (isGentoo) score -= 8;
  } else if (terminal >= 2) {
    if (isNix || isArch || isVoid || isEndeavour || isTumbleweed) score += 2;
    if (isGentoo && terminal === 3) score += 4;
  }

  if (troubleshoot <= 1) {
    if (isMint || isZorin || isUbuntu || isKubuntu || isPop) score += 3;
    if (isTumbleweed || isCachy || isArch || isVoid || isEndeavour) score -= 5;
    if (isBazzite || isNobara) score -= 2;
    if (isNix || isGentoo) score -= 4;
    causedBy.push(
      message(
        "You want low or guided troubleshooting.",
        "Du möchtest wenig oder nur geführte Fehlersuche."
      )
    );
  } else {
    if (
      isFedora ||
      isTumbleweed ||
      isCachy ||
      isNobara ||
      isBazzite ||
      isVoid ||
      isEndeavour
    ) score += 2;
  }

  if (answers.maintenance === "minimal") {
    if (isMint || isZorin || isUbuntu || isKubuntu || isPop) score += 5;
    if (isDebian) score += 3;
    if (isFedora) score -= 1;
    if (isRolling) score -= 8;
    if (isNobara) score -= 3;
    if (isBazzite && answers.systemInterest === "use_it") score += 1;
    reasons.push(
      ...(isMint || isZorin || isUbuntu || isKubuntu || isPop
        ? [
            message(
              "Its release model fits your low-maintenance preference.",
              "Das Release-Modell passt zu deinem Wunsch nach wenig Wartung."
            )
          ]
        : [])
    );
  } else if (answers.maintenance === "active" || answers.maintenance === "hobby") {
    if (isFedora || isTumbleweed || isCachy || isArch || isVoid || isEndeavour) score += 3;
    if (isNix || isGentoo) score += 2;
  }

  if (isSpecialistRolling && answers.maintenance === "minimal") {
    tradeoffs.push(
      message(
        "You prefer minimal maintenance; this profile expects active rolling-release ownership.",
        "Du möchtest möglichst wenig Wartung; dieses Profil setzt aktive Verantwortung für ein Rolling Release voraus."
      )
    );
  }

  if (answers.freshness === "stable") {
    if (isMint || isZorin || isUbuntu || isKubuntu || isPop || isDebian) score += 3;
    if (isRolling) score -= 2;
  } else if (answers.freshness === "newest") {
    if (isFedora) score += 4;
    if (isTumbleweed || isCachy || isArch || isVoid || isEndeavour) score += 5;
    if (isNobara || isBazzite) score += 3;
    if (isMint || isZorin || isDebian) score -= 2;
    reasons.push(
      ...(isFedora || isTumbleweed || isCachy || isArch || isVoid || isEndeavour
        ? [
            message(
              "It aligns with your preference for current kernels and packages.",
              "Es passt zu deinem Wunsch nach aktuellen Kerneln und Paketen."
            )
          ]
        : [])
    );
  }

  if (isRolling) {
    if (!acceptsRolling && !rollingMaybe) {
      score -= 10;
      maximumTier = "not_recommended";
      tradeoffs.push(
        message(
          "This is a rolling release, but you explicitly rejected rolling maintenance.",
          "Dies ist ein Rolling Release, du hast Rolling-Wartung aber ausdrücklich abgelehnt."
        )
      );
      changeFactors.push(
        message(
          "Explicitly accepting frequent rolling updates would change this result.",
          "Die ausdrückliche Bereitschaft zu häufigen Rolling-Updates würde das Ergebnis ändern."
        )
      );
    } else if (rollingMaybe) {
      maximumTier = capTier(maximumTier, "possible");
      tradeoffs.push(
        message(
          "You are only conditionally comfortable with a rolling release.",
          "Du akzeptierst ein Rolling Release nur unter Vorbehalt."
        )
      );
    } else {
      score += 3;
      reasons.push(
        message(
          "You explicitly accept a rolling release.",
          "Du akzeptierst ein Rolling Release ausdrücklich."
        )
      );
    }
  }

  if (answers.desktopPreference === "windows_like") {
    if (isMint || isZorin) score += 6;
    if (isKubuntu) score += 4;
    if (isFedora || isDebian || isTumbleweed) score += 2;
    if (isMint || isZorin || isKubuntu) {
      reasons.push(
        message(
          "Its desktop provides the familiar layout you requested.",
          "Der Desktop bietet die von dir gewünschte vertraute Oberfläche."
        )
      );
    }
  } else if (answers.desktopPreference === "kde") {
    if (isFedora || isTumbleweed || isKubuntu) score += 6;
    if (isDebian) score += 5;
    if (isCachy || isNobara || isBazzite || isEndeavour) score += 2;
    if (isNix || isArch) score += 1;
  } else if (answers.desktopPreference === "gnome") {
    if (isUbuntu) score += 5;
    if (isZorin || isNobara || isBazzite) score += 2;
  } else if (answers.desktopPreference === "build_my_own") {
    if (isArch) score += 7;
    if (isVoid) score += 5;
    if (isEndeavour) score += 2;
    if (isNix || isGentoo) score += 4;
    if (isMint || isZorin) score -= 2;
  }

  if (answers.windowsLikeUi === "important") {
    if (isMint || isZorin) score += 4;
    if (isKubuntu) score += 3;
    if (isFedora || isDebian || isTumbleweed) score += 1;
  } else if (answers.windowsLikeUi === "irrelevant") {
    if (isFedora || isUbuntu || isPop || isNix || isArch || isVoid) score += 1;
  }

  if (answers.gaming !== "none") {
    if (isMainstream) score += answers.gaming === "critical" ? 2 : 3;
    if (isTumbleweed) score += 2;
    reasons.push(
      ...(isMainstream
        ? [
            message(
              "Steam and gaming can be evaluated here without forcing a specialist distribution.",
              "Steam und Gaming lassen sich hier prüfen, ohne eine Spezial-Distribution zu erzwingen."
            )
          ]
        : [])
    );
    causedBy.push(
      message(
        "Gaming matters, so individual games and anti-cheat remain required tests.",
        "Gaming ist wichtig; einzelne Spiele und Anti-Cheat bleiben Pflichtprüfungen."
      )
    );
  }

  const specialistGamingReady =
    exp >= 2 &&
    troubleshoot >= 2 &&
    maintenance >= 2 &&
    answers.gaming === "critical";

  if (isCachy) {
    if (specialistGamingReady && acceptsRolling) {
      score += 11;
      reasons.push(
        message(
          "Your advanced experience, performance priority and rolling-release tolerance align together.",
          "Deine Erfahrung, Performance-Priorität und Rolling-Toleranz passen gemeinsam."
        )
      );
    } else {
      maximumTier = "not_recommended";
      tradeoffs.push(
        message(
          "CachyOS requires more than “gaming = yes”: advanced maintenance, troubleshooting and rolling tolerance are missing.",
          "CachyOS verlangt mehr als „Gaming = ja“: Erfahrung, Fehlersuche und Rolling-Toleranz fehlen."
        )
      );
    }
  }

  if (isNobara) {
    if (
      specialistGamingReady ||
      (exp >= 2 &&
        troubleshoot >= 2 &&
        answers.mediaProduction === "professional")
    ) {
      score += 9;
      reasons.push(
        message(
          "Your gaming/content-creation priority can benefit from its project-specific setup.",
          "Deine Gaming-/Content-Creation-Priorität kann von der projektspezifischen Einrichtung profitieren."
        )
      );
    } else if (isBeginner || answers.maintenance === "minimal") {
      maximumTier = capTier(maximumTier, "exploratory");
      tradeoffs.push(
        message(
          "Its project-specific changes add support and maintenance considerations beyond mainstream Fedora.",
          "Projektspezifische Änderungen bringen zusätzliche Support- und Wartungsfragen gegenüber Fedora."
        )
      );
    }
  }

  if (isBazzite) {
    const managedModelFits =
      answers.systemInterest === "use_it" || answers.systemInterest === "customize";
    const gamingFit =
      (answers.gaming === "important" || answers.gaming === "critical") &&
      managedModelFits;

    if (gamingFit) {
      score += answers.gaming === "critical" ? 11 : 8;
      reasons.push(
        message(
          "Your gaming priority and preference for a managed system make the image-based model worth evaluating.",
          "Deine Gaming-Priorität und der Wunsch nach einem verwalteten System machen das Image-Modell prüfenswert."
        )
      );
      tradeoffs.push(
        message(
          "Bazzite uses an image-based Fedora Atomic model rather than a conventional package-by-package host workflow.",
          "Bazzite nutzt ein Image-basiertes Fedora-Atomic-Modell statt eines konventionellen Host-Systems mit einzelner Paketverwaltung."
        )
      );
      if (isBeginner || troubleshoot <= 1) {
        maximumTier = capTier(maximumTier, "exploratory");
      }
    } else {
      score -= answers.gaming === "none" ? 5 : 2;
      maximumTier = capTier(maximumTier, "exploratory");
      changeFactors.push(
        message(
          "Bazzite rises when gaming is important and a managed image-based system matches how you want to maintain the computer.",
          "Bazzite steigt, wenn Gaming wichtig ist und ein verwaltetes Image-System zu deiner gewünschten Systempflege passt."
        )
      );
    }

    if (manualAssemblyIntent) {
      score -= 8;
      maximumTier = capTier(maximumTier, "exploratory");
      tradeoffs.push(
        message(
          "You want direct ownership of major system layers; Bazzite intentionally manages the host as an image.",
          "Du möchtest wesentliche Systemebenen direkt kontrollieren; Bazzite verwaltet den Host bewusst als Image."
        )
      );
    }
  }

  if (answers.gameLaunchers.some((launcher) => launcher !== "steam")) {
    tradeoffs.push(
      message(
        "One or more required launchers need title-by-title manual verification.",
        "Mindestens ein benötigter Launcher muss für jedes Spiel einzeln geprüft werden."
      )
    );
  }

  if (answers.office === "complex") {
    if (isMint || isZorin || isUbuntu || isKubuntu || isPop) score += 1;
    if (isNix || isArch || isVoid || isEndeavour || isGentoo) score -= 2;
    tradeoffs.push(
      message(
        "Complex Microsoft Office files, macros and integrations require representative testing.",
        "Komplexe Microsoft-Office-Dateien, Makros und Integrationen müssen repräsentativ getestet werden."
      )
    );
  }

  if (answers.development === "web" || answers.development === "cross_platform") {
    if (isUbuntu || isPop || isFedora) score += 3;
    if (isKubuntu) score += 2;
    if (isNix || isArch || isVoid || isEndeavour) score += exp >= 2 ? 2 : 0;
  } else if (answers.development === "microsoft_stack") {
    tradeoffs.push(
      message(
        "A full Visual Studio or Windows-SDK workflow may require keeping Windows.",
        "Ein vollständiger Visual-Studio- oder Windows-SDK-Ablauf kann Windows weiterhin erfordern."
      )
    );
  }

  if (answers.creative === "professional") {
    if (isUbuntu || isPop || isFedora) score += 1;
    if (isNobara && exp >= 2) score += 3;
    tradeoffs.push(
      message(
        "Professional creative workflows must be validated app, plugin, format and colour pipeline by pipeline.",
        "Professionelle Kreativabläufe müssen je App, Plugin, Format und Farb-Pipeline geprüft werden."
      )
    );
  }

  if (answers.mediaProduction === "professional") {
    if (isNobara && exp >= 2) score += 4;
    if (isUbuntu || isPop || isFedora) score += 1;
  }

  if (answers.professionalDependencies === "essential") {
    tradeoffs.push(
      message(
        "You require exact professional applications; software assessment can override this distro fit.",
        "Du benötigst exakte Profi-Anwendungen; die Softwareprüfung kann diese Distributions-Eignung überstimmen."
      )
    );
  }

  if (answers.gpuVendor === "nvidia") {
    if (isMainstream) score += 1;
    if (isNobara) score += specialistGamingReady ? 1 : 0;
    reasons.push(
      ...(isMainstream
        ? [
            message(
              "NVIDIA is handled through this distribution's supported driver workflow; it does not require an enthusiast distro.",
              "NVIDIA wird über den unterstützten Treiberweg dieser Distribution behandelt; eine Enthusiasten-Distribution ist nicht nötig."
            )
          ]
        : [])
    );
    if (answers.proprietaryTolerance === "avoid") {
      tradeoffs.push(
        message(
          "Your NVIDIA hardware and wish to avoid proprietary drivers create a policy conflict.",
          "NVIDIA-Hardware und der Wunsch, proprietäre Treiber zu vermeiden, erzeugen einen Zielkonflikt."
        )
      );
    }
  } else if (
    answers.gpuVendor === "amd" &&
    answers.gaming === "critical" &&
    (isFedora || isTumbleweed || isCachy || isBazzite)
  ) {
    score += 2;
  }

  if (answers.secureBoot === "required") {
    if (isMint || isZorin || isUbuntu || isKubuntu || isFedora || isDebian) score += 1;
    if (isPop) {
      score -= 5;
      maximumTier = "not_recommended";
      tradeoffs.push(
        message(
          "Current official Pop!_OS installation guidance requires Secure Boot to be disabled, which conflicts with your requirement.",
          "Die aktuelle offizielle Pop!_OS-Installationsanleitung verlangt deaktiviertes Secure Boot und widerspricht damit deiner Anforderung."
        )
      );
    }
    if (
      isCachy ||
      isNobara ||
      isBazzite ||
      isVoid ||
      isEndeavour ||
      isArch ||
      isGentoo
    ) {
      score -= 2;
      tradeoffs.push(
        message(
          "Secure Boot and third-party modules need a current, distro-specific verification path.",
          "Secure Boot und Drittanbieter-Module brauchen einen aktuellen, distributionsspezifischen Prüfweg."
        )
      );
    }
  }

  if (answers.systemInterest === "use_it") {
    if (isMainstream) score += 3;
    if (isBazzite) score += 3;
    if (isNix || isArch) score -= 8;
    if (isVoid) score -= 7;
    if (isEndeavour) score -= 5;
    if (isGentoo) score -= 12;
  } else if (answers.systemInterest === "customize") {
    if (isFedora || isTumbleweed || isDebian || isKubuntu) score += 3;
    if (isPop) score += 2;
    if (isMint) score += 1;
    if (isEndeavour) score += 4;
    if (isVoid) score += 3;
    if (isArch) score += 2;
    if (isBazzite) score += 1;
  } else if (answers.systemInterest === "declarative") {
    if (isNix) {
      score += 20;
      reasons.push(
        message(
          "You explicitly asked for a declarative, reproducible system-as-code model.",
          "Du hast ausdrücklich ein deklaratives, reproduzierbares System-as-Code-Modell gewählt."
        )
      );
    }
  } else if (answers.systemInterest === "manual_build") {
    if (isArch) {
      score += 15;
      reasons.push(
        message(
          "You explicitly want to assemble and learn each system layer.",
          "Du möchtest ausdrücklich jede Systemebene selbst aufbauen und lernen."
        )
      );
    }
    if (isVoid) score += 12;
    if (isEndeavour) score += 5;
    if (isGentoo) score += 5;
  } else if (answers.systemInterest === "compile_control") {
    if (isGentoo) {
      score += 28;
      reasons.push(
        message(
          "You explicitly want compilation, USE flags and full manual control.",
          "Du möchtest ausdrücklich Kompilierung, USE-Flags und vollständige manuelle Kontrolle."
        )
      );
    }
    if (isArch) score += 5;
    if (isVoid) score += 6;
    if (isEndeavour) score += 2;
  }

  if (isNix) {
    if (answers.systemInterest !== "declarative") {
      maximumTier = "not_recommended";
      changeFactors.push(
        message(
          "Explicitly choosing declarative configuration-as-code is required for NixOS to rise.",
          "NixOS steigt nur mit der ausdrücklichen Wahl deklarativer Configuration-as-Code."
        )
      );
    } else if (exp < 2 || terminal < 1) {
      maximumTier = capTier(maximumTier, "exploratory");
      tradeoffs.push(
        message(
          "Your system-model interest fits, but current Linux/terminal experience makes this experimental.",
          "Das Systeminteresse passt, aber deine Linux-/Terminal-Erfahrung macht diese Option experimentell."
        )
      );
    }
  }

  if (isVoid) {
    if (isBeginner) {
      maximumTier = "not_recommended";
      changeFactors.push(
        message(
          "Void requires meaningful Linux experience, terminal comfort, troubleshooting and active rolling maintenance together.",
          "Void verlangt gemeinsam echte Linux-Erfahrung, Terminal-Sicherheit, Fehlersuche und aktive Rolling-Wartung."
        )
      );
    } else if (!advancedRollingReady) {
      maximumTier = capTier(maximumTier, "exploratory");
      tradeoffs.push(
        message(
          "Void assumes advanced Linux experience, terminal troubleshooting and active rolling-release maintenance.",
          "Void setzt fortgeschrittene Linux-Erfahrung, Fehlersuche im Terminal und aktive Rolling-Wartung voraus."
        )
      );
    } else {
      score += 10;
      reasons.push(
        message(
          "Your Linux experience, terminal confidence and rolling-maintenance tolerance make Void a realistic specialist option.",
          "Deine Linux-Erfahrung, Terminal-Sicherheit und Rolling-Wartungsbereitschaft machen Void zu einer realistischen Spezialistenoption."
        )
      );
    }

    if (answers.systemInterest === "use_it") {
      maximumTier = capTier(maximumTier, "exploratory");
      tradeoffs.push(
        message(
          "You prefer sensible defaults and graphical tools; Void's independent XBPS/runit model expects more hands-on administration.",
          "Du bevorzugst sinnvolle Voreinstellungen und grafische Werkzeuge; Voids eigenständiges XBPS-/runit-Modell verlangt mehr manuelle Administration."
        )
      );
    }
  }

  if (isEndeavour) {
    const endeavourReady =
      exp >= 2 && terminal >= 2 && troubleshoot >= 2 && maintenance >= 2 && acceptsRolling;
    if (isBeginner) {
      maximumTier = "not_recommended";
      changeFactors.push(
        message(
          "The installer does not remove EndeavourOS's terminal and rolling-maintenance expectations.",
          "Der Installer beseitigt nicht die Terminal- und Rolling-Wartungsanforderungen von EndeavourOS."
        )
      );
    } else if (!endeavourReady) {
      maximumTier = capTier(maximumTier, "exploratory");
      tradeoffs.push(
        message(
          "EndeavourOS still requires terminal confidence, troubleshooting and active rolling maintenance after installation.",
          "EndeavourOS verlangt auch nach der Installation Terminal-Sicherheit, Fehlersuche und aktive Rolling-Wartung."
        )
      );
    } else {
      score += 9;
      reasons.push(
        message(
          "Your experience supports an Arch-based rolling system while the installer reduces initial assembly work.",
          "Deine Erfahrung passt zu einem Arch-basierten Rolling-System, während der Installer die Ersteinrichtung reduziert."
        )
      );
    }

    if (answers.systemInterest === "use_it") {
      maximumTier = capTier(maximumTier, "possible");
    }
  }

  if (isArch) {
    if (isBeginner || answers.systemInterest === "use_it") {
      maximumTier = "not_recommended";
      changeFactors.push(
        message(
          "Arch conflicts with a beginner path or a preference for sensible preassembled defaults.",
          "Arch widerspricht einem Einsteigerweg oder dem Wunsch nach sinnvoll vorkonfigurierten Voreinstellungen."
        )
      );
    } else if (!advancedRollingReady) {
      maximumTier = capTier(maximumTier, "exploratory");
      tradeoffs.push(
        message(
          "Arch requires advanced experience, terminal confidence, troubleshooting and rolling-release acceptance together.",
          "Arch verlangt gemeinsam fortgeschrittene Erfahrung, Terminal-Sicherheit, Fehlersuche und Rolling-Akzeptanz."
        )
      );
    } else {
      score += 7;
      reasons.push(
        message(
          "Your Linux experience and active rolling-maintenance tolerance make Arch technically realistic.",
          "Deine Linux-Erfahrung und aktive Rolling-Wartungsbereitschaft machen Arch technisch realistisch."
        )
      );
      if (!manualAssemblyIntent) {
        maximumTier = capTier(maximumTier, "possible");
        tradeoffs.push(
          message(
            "Your skills fit, but you did not make manual system assembly a primary goal.",
            "Deine Fähigkeiten passen, aber manueller Systemaufbau ist für dich kein Hauptziel."
          )
        );
      }
    }
  }

  if (isGentoo) {
    const expertFit =
      answers.systemInterest === "compile_control" &&
      answers.experience === "expert" &&
      answers.terminalComfort === "enthusiast" &&
      answers.troubleshooting === "enthusiast" &&
      answers.maintenance === "hobby" &&
      acceptsRolling;
    if (!expertFit) {
      maximumTier = "not_recommended";
      changeFactors.push(
        message(
          "Gentoo appears only with expert experience, compilation intent, patience and full maintenance tolerance.",
          "Gentoo erscheint nur bei Expertenwissen, Kompilierungswunsch, Geduld und voller Wartungsbereitschaft."
        )
      );
    } else {
      reasons.push(
        message(
          "You appear to want to build, understand and control the system rather than merely use it.",
          "Du möchtest das System offenbar bauen, verstehen und kontrollieren, statt es nur zu benutzen."
        )
      );
    }
  }

  if (answers.deviceType === "laptop") {
    tradeoffs.push(
      message(
        "Laptop suspend, battery, webcam, microphone and external displays still require a live test.",
        "Standby, Akku, Webcam, Mikrofon und externe Anzeigen müssen am Laptop live getestet werden."
      )
    );
  }

  if (answers.migrationMode === "replace") {
    if (isMainstream) score += 1;
    causedBy.push(
      message(
        "You eventually want to replace Windows, so predictable recovery and support matter more.",
        "Du möchtest Windows später ersetzen; vorhersehbare Wiederherstellung und Support wiegen daher stärker."
      )
    );
  } else if (answers.migrationMode === "test") {
    reasons.push(
      message(
        "A live session lets you evaluate this option without changing internal disks.",
        "Mit einer Live-Sitzung kannst du diese Option ohne Änderung interner Datenträger prüfen."
      )
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      message(
        "It remains a reference option, but no answer created a strong positive fit.",
        "Es bleibt eine Vergleichsoption, aber keine Antwort erzeugte eine starke positive Eignung."
      )
    );
  }

  if (changeFactors.length === 0) {
    changeFactors.push(
      message(
        "Changing maintenance, desktop or workflow requirements could reorder the result.",
        "Andere Wartungs-, Desktop- oder Arbeitsablauf-Anforderungen könnten die Reihenfolge ändern."
      )
    );
  }

  const tier = capTier(scoreTier(score), maximumTier);
  return { score, tier, reasons, tradeoffs, causedBy, changeFactors };
}

export function recommendDistros(
  answers: AdvisorAnswers
): DistroRecommendation[] {
  return distros
    .map((distro) => ({ distro, ...scoreOne(distro.id, answers) }))
    .sort((a, b) => {
      const tierDifference = tierOrder[b.tier] - tierOrder[a.tier];
      return tierDifference || b.score - a.score || a.distro.name.localeCompare(b.distro.name);
    });
}

export interface AdvisorWarning {
  severity: "info" | "warning" | "blocker";
  title: LocalizedText;
  detail: LocalizedText;
}

export function buildAdvisorWarnings(
  answers: AdvisorAnswers
): AdvisorWarning[] {
  const warnings: AdvisorWarning[] = [];
  if (answers.currentWindows === "windows10") {
    warnings.push({
      severity: "info",
      title: message("Windows 10 support context", "Windows-10-Supportlage"),
      detail: message(
        "Standard support ended in 2025; eligible enrolled consumers may have Extended Security Updates. Verify your own device before rushing a migration.",
        "Der Standardsupport endete 2025; berechtigte angemeldete Verbraucher können Extended Security Updates erhalten. Prüfe deinen Rechner, statt überstürzt umzusteigen."
      )
    });
  }
  if (
    answers.gameLaunchers.includes("xbox") ||
    answers.gameLaunchers.includes("riot")
  ) {
    warnings.push({
      severity: "blocker",
      title: message(
        "A gaming blocker may exist",
        "Ein Gaming-Blocker ist möglich"
      ),
      detail: message(
        "PC Game Pass installation or kernel-level anti-cheat can require Windows. Verify every must-play title before removing it.",
        "PC-Game-Pass-Installationen oder kernel-nahes Anti-Cheat können Windows voraussetzen. Prüfe jeden Pflicht-Titel vor dem Entfernen."
      )
    });
  } else if (answers.gameLaunchers.some((launcher) => launcher !== "steam")) {
    warnings.push({
      severity: "warning",
      title: message(
        "Launcher compatibility is not guaranteed",
        "Launcher-Kompatibilität ist nicht garantiert"
      ),
      detail: message(
        "Community compatibility layers can change. Verify the exact launcher and games.",
        "Community-Kompatibilität kann sich ändern. Prüfe den genauen Launcher und die Spiele."
      )
    });
  }
  if (answers.office === "complex") {
    warnings.push({
      severity: "warning",
      title: message(
        "Complex Office workflow",
        "Komplexer Office-Arbeitsablauf"
      ),
      detail: message(
        "Web apps and alternative suites are not automatic equivalents for macros, add-ins or exact layout.",
        "Web-Apps und alternative Suiten sind kein automatischer Ersatz für Makros, Add-ins oder exaktes Layout."
      )
    });
  }
  if (
    answers.development === "microsoft_stack" ||
    answers.professionalDependencies === "essential"
  ) {
    warnings.push({
      severity: "blocker",
      title: message(
        "Exact Windows tooling may be required",
        "Exakte Windows-Werkzeuge könnten erforderlich sein"
      ),
      detail: message(
        "Complete the software assessment before treating any distro as a migration recommendation.",
        "Schließe die Softwareprüfung ab, bevor du eine Distribution als Umstiegsempfehlung behandelst."
      )
    });
  }
  if (answers.creative === "professional") {
    warnings.push({
      severity: "warning",
      title: message(
        "Professional creative workflow",
        "Professioneller Kreativablauf"
      ),
      detail: message(
        "Adobe apps, plugins, colour management and project exchange require separate evidence.",
        "Adobe-Apps, Plugins, Farbmanagement und Projektaustausch brauchen getrennte Nachweise."
      )
    });
  }
  if (
    answers.gpuVendor === "nvidia" &&
    answers.proprietaryTolerance === "avoid"
  ) {
    warnings.push({
      severity: "warning",
      title: message(
        "NVIDIA policy conflict",
        "NVIDIA-Zielkonflikt"
      ),
      detail: message(
        "Avoiding proprietary drivers may conflict with the supported path for this GPU. Keep the result UNKNOWN until tested.",
        "Das Vermeiden proprietärer Treiber kann dem unterstützten Weg für diese GPU widersprechen. Das Ergebnis bleibt bis zum Test UNBEKANNT."
      )
    });
  }
  if (answers.secureBoot === "required") {
    warnings.push({
      severity: "info",
      title: message("Secure Boot must be verified", "Secure Boot muss geprüft werden"),
      detail: message(
        "Use current distro documentation, especially when a third-party graphics module is involved.",
        "Nutze aktuelle Distributionsdokumentation, besonders bei Grafikmodulen von Drittanbietern."
      )
    });
  }
  return warnings;
}

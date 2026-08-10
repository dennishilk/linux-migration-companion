import { distroById } from "../data/distros";
import { softwareById } from "../data/software";
import type {
  AdvisorAnswers,
  FirstBootStep,
  LiveTestResults,
  LocalizedText,
  SoftwareSelections
} from "../domain/types";

const message = (en: string, de: string): LocalizedText => ({ en, de });

function step(
  id: string,
  title: LocalizedText,
  summary: LocalizedText,
  explanation: LocalizedText,
  caution?: LocalizedText
): FirstBootStep {
  return { id, title, summary, explanation, ...(caution ? { caution } : {}) };
}

export function buildFirstBootPlan(
  distroId: string | null,
  answers: AdvisorAnswers,
  selections: SoftwareSelections,
  liveTests: LiveTestResults
): FirstBootStep[] {
  const distro = distroId ? distroById.get(distroId) : undefined;
  const distroName = distro?.name ?? "Linux";
  const plan: FirstBootStep[] = [
    step(
      "updates",
      message("Install reviewed system updates", "Geprüfte Systemupdates installieren"),
      message(
        `Open ${distroName}'s official graphical update tool and review the proposed changes.`,
        `Öffne das offizielle grafische Update-Werkzeug von ${distroName} und prüfe die vorgeschlagenen Änderungen.`
      ),
      message(
        "Updates correct known security and stability issues. Alpha deliberately opens no package manager and executes nothing.",
        "Updates beheben bekannte Sicherheits- und Stabilitätsprobleme. Alpha öffnet bewusst keinen Paketmanager und führt nichts aus."
      )
    ),
    step(
      "backup",
      message("Configure a real backup", "Ein echtes Backup einrichten"),
      message(
        "Choose an external destination and verify that one test file can be restored.",
        "Wähle ein externes Ziel und prüfe die Wiederherstellung einer Testdatei."
      ),
      message(
        "A snapshot can help with system changes, but it is not a backup of files stored on the same disk.",
        "Ein Snapshot kann bei Systemänderungen helfen, ist aber kein Backup von Dateien auf demselben Datenträger."
      )
    )
  ];

  if (answers.gpuVendor === "nvidia") {
    plan.push(
      step(
        "nvidia",
        message("Verify the supported NVIDIA driver", "Unterstützten NVIDIA-Treiber prüfen"),
        message(
          `Use ${distroName}'s supported driver-management workflow and reboot only when its official guidance asks.`,
          `Nutze den unterstützten Treiberweg von ${distroName} und starte nur neu, wenn die offizielle Anleitung es verlangt.`
        ),
        message(
          "Do not copy a driver version from this Alpha. The correct branch changes with GPU, kernel and distribution.",
          "Übernimm keine Treiberversion aus diesem Alpha. Der richtige Zweig hängt von GPU, Kernel und Distribution ab."
        ),
        answers.secureBoot === "required"
          ? message(
              "Secure Boot may require a distro-specific trusted-module or key-enrolment path. Keep it enabled and follow current official documentation.",
              "Secure Boot kann einen distributionsspezifischen Weg für vertrauenswürdige Module oder Schlüsselregistrierung verlangen. Aktiviert lassen und aktuelle offizielle Dokumentation nutzen."
            )
          : undefined
      )
    );
  }

  if ("steam" in selections || answers.gameLaunchers.includes("steam")) {
    plan.push(
      step(
        "steam",
        message("Install Steam from the supported source", "Steam aus der unterstützten Quelle installieren"),
        message(
          `Use ${distroName}'s software centre or documented repository path.`,
          `Nutze das Software-Center oder den dokumentierten Paketquellenweg von ${distroName}.`
        ),
        message(
          "Steam availability does not verify any game. Re-test every must-play title, anti-cheat, controller, saves and mods.",
          "Steam-Verfügbarkeit bestätigt kein Spiel. Jeden Pflicht-Titel, Anti-Cheat, Controller, Spielstände und Mods erneut testen."
        ),
        message(
          "Keep Windows until every must-play game has passed your own test.",
          "Windows behalten, bis jedes Pflicht-Spiel den eigenen Test bestanden hat."
        )
      )
    );
  }

  const selectedRecords = Object.keys(selections)
    .map((id) => softwareById.get(id))
    .filter((record) => record !== undefined);

  for (const record of selectedRecords.filter(
    (software) =>
      software.baseRisk === "low" &&
      software.routes.includes("native") &&
      software.id !== "steam"
  )) {
    plan.push(
      step(
        `software-${record.id}`,
        message(`Install ${record.name}`, `${record.name} installieren`),
        message(
          `Use ${distroName}'s supported software source and confirm the publisher/package identity.`,
          `Nutze die unterstützte Softwarequelle von ${distroName} und bestätige Anbieter-/Paketidentität.`
        ),
        message(
          "The Passport selected this app, but Alpha never installs it or accepts licences for you.",
          "Der Passport hat diese App ausgewählt, aber Alpha installiert sie nicht und akzeptiert keine Lizenzen für dich."
        )
      )
    );
  }

  const unresolvedTests = Object.entries(liveTests).filter(
    ([, status]) => status === "issue" || status === "not_tested"
  );
  if (unresolvedTests.length) {
    plan.push(
      step(
        "unresolved-hardware",
        message("Resolve unfinished hardware tests", "Offene Hardwaretests klären"),
        message(
          `${unresolvedTests.length} live-test item(s) are unresolved. Re-test after updates and record the result.`,
          `${unresolvedTests.length} Live-Test-Punkt(e) sind offen. Nach Updates erneut testen und Ergebnis erfassen.`
        ),
        message(
          "A driver being loaded is not proof that suspend, printing, audio or display routing works.",
          "Ein geladener Treiber beweist nicht, dass Standby, Druck, Audio oder Display-Routing funktionieren."
        ),
        message(
          "Do not remove Windows while an essential device still fails or remains untested.",
          "Windows nicht entfernen, solange ein wichtiges Gerät ausfällt oder ungetestet ist."
        )
      )
    );
  }

  if (distroId === "nixos") {
    plan.push(
      step(
        "nixos-boundary",
        message("Keep hardware configuration machine-local", "Hardware-Konfiguration lokal erzeugen"),
        message(
          "Generate and review hardware-configuration.nix on this installed machine. Do not import guessed disk, boot or secret settings.",
          "hardware-configuration.nix auf diesem installierten Rechner erzeugen und prüfen. Keine geratenen Datenträger-, Boot- oder Geheimniswerte übernehmen."
        ),
        message(
          "Alpha produces no NixOS configuration and never writes secrets or disk layouts.",
          "Alpha erzeugt keine NixOS-Konfiguration und schreibt niemals Geheimnisse oder Datenträgerlayouts."
        )
      )
    );
  }

  return plan;
}

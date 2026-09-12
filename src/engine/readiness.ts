import { liveTestDefinitions } from "../data/liveTests";
import { hardwareClassById } from "../data/hardware";
import type {
  HardwareClassId,
  HardwareEvidence,
  LocalizedText,
  MigrationPassport,
  ReadinessGate,
  ReadinessAssessment,
  SoftwareAssessment
} from "../domain/types";
import { buildDataMigrationAssessment } from "./dataMigration";

const message = (en: string, de: string): LocalizedText => ({ en, de });

const evidenceLabels: Record<HardwareEvidence["state"], LocalizedText> = {
  unknown: message("unknown", "unbekannt"),
  known_fact: message("a recorded fact", "ein erfasster Fakt"),
  user_reported: message("user-reported", "vom Nutzer angegeben"),
  live_verified: message("live verified", "live bestätigt"),
  failed_test: message("a failed test", "ein fehlgeschlagener Test"),
  known_issue: message("a known issue", "ein bekanntes Problem"),
  not_applicable: message("not applicable", "nicht zutreffend")
};

function softwareVerificationGate(
  item: SoftwareAssessment["items"][number],
  kind: "blocker" | "essential_review" | "tradeoff"
): ReadinessGate {
  if (kind === "blocker") {
    return {
      decidingFactor: message(
        `${item.record.name} is the first active hard blocker: its essential workflow has no supported equivalent.`,
        `${item.record.name} ist der erste aktive harte Blocker: Für den unverzichtbaren Arbeitsablauf gibt es keinen unterstützten Ersatz.`
      ),
      nextAction: message(
        `Keep Windows for this workflow while you test a supported replacement or change the requirement. Verification focus: ${item.record.verify.en}`,
        `Windows für diesen Arbeitsablauf behalten, während ein unterstützter Ersatz getestet oder die Anforderung geändert wird. Prüffokus: ${item.record.verify.de}`
      )
    };
  }

  if (kind === "essential_review") {
    return {
      decidingFactor: message(
        `${item.record.name} is essential and remains insufficiently verified.`,
        `${item.record.name} ist unverzichtbar und noch nicht ausreichend verifiziert.`
      ),
      nextAction: message(
        `Run a representative end-to-end verification before removing Windows: ${item.record.verify.en}`,
        `Vor dem Entfernen von Windows eine repräsentative Ende-zu-Ende-Prüfung durchführen: ${item.record.verify.de}`
      )
    };
  }

  return {
    decidingFactor: message(
      `${item.record.name} is the most relevant remaining software trade-off.`,
      `${item.record.name} ist der derzeit wichtigste verbleibende Software-Kompromiss.`
    ),
    nextAction: message(
      `Verify the real workflow before removing Windows: ${item.record.verify.en}`,
      `Den echten Arbeitsablauf vor dem Entfernen von Windows prüfen: ${item.record.verify.de}`
    )
  };
}

export function assessMigrationReadiness(
  passport: MigrationPassport,
  software: SoftwareAssessment
): ReadinessAssessment {
  const blockers: LocalizedText[] = [];
  const reasons: LocalizedText[] = [];
  const checks: LocalizedText[] = [];

  for (const item of software.blockers) {
    blockers.push(
      message(
        `${item.record.name} is essential and has no supported equivalent for the recorded workflow.`,
        `${item.record.name} ist unverzichtbar und besitzt für den erfassten Arbeitsablauf keinen unterstützten Ersatz.`
      )
    );
  }

  const hardwareEvidence = Object.entries(passport.hardware.evidence) as [
    HardwareClassId,
    HardwareEvidence
  ][];
  const requiredHardware = hardwareEvidence.filter(([, evidence]) => evidence.required);
  const failedHardware = requiredHardware.filter(([, evidence]) =>
    ["failed_test", "known_issue"].includes(evidence.state)
  );
  const unresolvedHardware = requiredHardware.filter(([, evidence]) =>
    ["unknown", "known_fact", "user_reported"].includes(evidence.state)
  );

  if (failedHardware.length) {
    blockers.push(
      message(
        `${failedHardware.length} required hardware item(s) have a failed test or known issue.`,
        `${failedHardware.length} benötigte Hardware-Punkt(e) haben einen fehlgeschlagenen Test oder ein bekanntes Problem.`
      )
    );
  }

  const liveIssues = liveTestDefinitions.filter(
    (definition) => passport.liveTests[definition.id] === "issue"
  );
  if (liveIssues.length) {
    blockers.push(
      message(
        `${liveIssues.length} live hardware test(s) recorded a problem.`,
        `${liveIssues.length} Live-Hardwaretest(s) haben ein Problem ergeben.`
      )
    );
  }

  const essentialReviewItems = software.items.filter(
    (item) => item.priority === "essential" && item.risk !== "low"
  );
  if (essentialReviewItems.length && !software.blockers.length) {
    checks.push(
      message(
        `${essentialReviewItems.length} essential workflow(s) still require representative verification.`,
        `${essentialReviewItems.length} unverzichtbare Arbeitsabläufe müssen noch repräsentativ geprüft werden.`
      )
    );
  }

  if (unresolvedHardware.length) {
    checks.push(
      message(
        `${unresolvedHardware.length} required hardware item(s) are not live-test verified.`,
        `${unresolvedHardware.length} benötigte Hardware-Punkt(e) sind nicht durch einen Live-Test bestätigt.`
      )
    );
  }

  const untestedEssentialLive = liveTestDefinitions.filter(
    (definition) =>
      definition.essential &&
      passport.liveTests[definition.id] === "not_tested"
  );
  if (untestedEssentialLive.length) {
    checks.push(
      message(
        `${untestedEssentialLive.length} essential live-session check(s) remain untested.`,
        `${untestedEssentialLive.length} wichtige Live-Session-Prüfung(en) sind noch ungetestet.`
      )
    );
  }

  if (passport.answers.gaming !== "none") {
    checks.push(
      message(
        "Actual games, anti-cheat, saves, mods and peripherals still need title-by-title verification.",
        "Echte Spiele, Anti-Cheat, Spielstände, Mods und Peripherie müssen weiterhin Titel für Titel geprüft werden."
      )
    );
  }

  const data = buildDataMigrationAssessment(passport.dataMigration);
  if (!data.items.length) {
    checks.push(
      message(
        "No data migration inventory has been recorded yet.",
        "Es wurde noch kein Datenmigrations-Inventar erfasst."
      )
    );
  } else if (!data.evidenceComplete) {
    checks.push(
      message(
        "The data plan lacks a recorded backup or still contains an essential DO NOT ASSUME item.",
        "Im Datenplan fehlt ein erfasstes Backup oder ein unverzichtbarer NICHT ANNEHMEN-Punkt ist noch offen."
      )
    );
  }

  const noEvidence =
    software.items.length === 0 &&
    Object.values(passport.hardware.evidence).every(
      (evidence) => evidence.state === "unknown"
    ) &&
    Object.values(passport.liveTests).every((status) => status === "not_tested");

  if (blockers.length) {
    let currentGate: ReadinessGate;
    const softwareBlocker = software.blockers[0];
    const failedRequiredHardware = failedHardware[0];
    const failedLiveTest = liveIssues[0];

    if (softwareBlocker) {
      currentGate = softwareVerificationGate(softwareBlocker, "blocker");
    } else if (failedRequiredHardware) {
      const [id, evidence] = failedRequiredHardware;
      const title = hardwareClassById.get(id)!.title;
      const evidenceLabel = evidenceLabels[evidence.state];
      currentGate = {
        decidingFactor: message(
          `${title.en} is required and has ${evidenceLabel.en}.`,
          `${title.de} wird benötigt und hat ${evidenceLabel.de}.`
        ),
        nextAction: message(
          `Retest ${title.en} on the target system after a concrete driver, configuration or hardware change. If the problem remains, keep Windows or replace the affected device or requirement.`,
          `${title.de} nach einer konkreten Treiber-, Konfigurations- oder Hardwareänderung auf dem Zielsystem erneut testen. Bleibt das Problem bestehen, Windows behalten oder das betroffene Gerät beziehungsweise die Anforderung ersetzen.`
        )
      };
    } else {
      currentGate = {
        decidingFactor: message(
          `The live-session test for ${failedLiveTest.title.en} recorded a problem.`,
          `Der Live-Session-Test für ${failedLiveTest.title.de} hat ein Problem ergeben.`
        ),
        nextAction: message(
          `Repeat the representative ${failedLiveTest.title.en} test only after a concrete change. Keep Windows if the required function still fails.`,
          `Den repräsentativen Test für ${failedLiveTest.title.de} erst nach einer konkreten Änderung wiederholen. Windows behalten, falls die benötigte Funktion weiterhin fehlschlägt.`
        )
      };
    }

    return {
      state: "blocked",
      strategy: software.blockers.length
        ? "keep_windows_for_workflows"
        : "migration_blocked",
      currentGate,
      reasons,
      checks,
      blockers
    };
  }

  if (essentialReviewItems.length) {
    reasons.push(
      message(
        "Windows remains the proven path for at least one essential but unverified workflow.",
        "Windows bleibt für mindestens einen unverzichtbaren, aber ungeprüften Arbeitsablauf der nachgewiesene Weg."
      )
    );
    return {
      state: "windows_should_be_retained",
      strategy: "keep_windows_temporarily",
      currentGate: softwareVerificationGate(essentialReviewItems[0], "essential_review"),
      reasons,
      checks,
      blockers
    };
  }

  if (noEvidence) {
    return {
      state: "insufficient_evidence",
      strategy: "test_first",
      currentGate: {
        decidingFactor: message(
          "Usable software and real hardware evidence is still missing.",
          "Nutzbare Software- und echte Hardware-Evidenz fehlt noch."
        ),
        nextAction: message(
          "Record at least one real software workflow and the hardware you need, then run the relevant live-session checks.",
          "Mindestens einen echten Software-Arbeitsablauf und die benötigte Hardware erfassen und danach die relevanten Live-Session-Prüfungen durchführen."
        )
      },
      reasons: [
        message(
          "Preferences are recorded, but software and real hardware evidence are still empty.",
          "Vorlieben sind erfasst, aber Software- und echte Hardware-Evidenz fehlen noch."
        )
      ],
      checks,
      blockers
    };
  }

  if (unresolvedHardware.length || untestedEssentialLive.length) {
    const unresolvedRequiredHardware = unresolvedHardware[0];
    const untestedLiveTest = untestedEssentialLive[0];
    let currentGate: ReadinessGate;

    if (unresolvedRequiredHardware) {
      const [id, evidence] = unresolvedRequiredHardware;
      const title = hardwareClassById.get(id)!.title;
      const evidenceLabel = evidenceLabels[evidence.state];
      currentGate = {
        decidingFactor: message(
          `${title.en} is required, but its evidence is ${evidenceLabel.en} rather than live verified.`,
          `${title.de} wird benötigt, aber die Evidenz ist nur ${evidenceLabel.de} statt live bestätigt.`
        ),
        nextAction: message(
          `Test the required ${title.en} functions on the target system and record the live result.`,
          `Die benötigten Funktionen von ${title.de} auf dem Zielsystem testen und das Live-Ergebnis erfassen.`
        )
      };
    } else {
      currentGate = {
        decidingFactor: message(
          `The essential live-session check for ${untestedLiveTest.title.en} is still untested.`,
          `Die wichtige Live-Session-Prüfung für ${untestedLiveTest.title.de} ist noch ungetestet.`
        ),
        nextAction: message(
          `Complete the ${untestedLiveTest.title.en} check on the target system and record whether it works or has an issue.`,
          `Die Prüfung für ${untestedLiveTest.title.de} auf dem Zielsystem durchführen und erfassen, ob sie funktioniert oder ein Problem hat.`
        )
      };
    }

    reasons.push(
      message(
        "Required hardware remains unknown or user-reported rather than live verified.",
        "Benötigte Hardware ist noch unbekannt oder nur vom Nutzer angegeben statt live bestätigt."
      )
    );
    return {
      state: "live_test_required",
      strategy: passport.answers.migrationMode === "dual_boot" ? "dual_boot" : "test_first",
      currentGate,
      reasons,
      checks,
      blockers
    };
  }

  if (software.tradeoffs.length || checks.length) {
    let currentGate: ReadinessGate;
    const softwareTradeoff = software.tradeoffs[0];
    if (softwareTradeoff) {
      currentGate = softwareVerificationGate(softwareTradeoff, "tradeoff");
    } else if (passport.answers.gaming !== "none") {
      currentGate = {
        decidingFactor: message(
          "Game compatibility remains a title-by-title check, including anti-cheat, saves, mods and peripherals.",
          "Spielekompatibilität bleibt eine Prüfung für jeden einzelnen Titel, einschließlich Anti-Cheat, Spielständen, Mods und Peripherie."
        ),
        nextAction: message(
          "Test every game that matters in the intended Linux environment before removing Windows.",
          "Jedes wichtige Spiel in der vorgesehenen Linux-Umgebung testen, bevor Windows entfernt wird."
        )
      };
    } else if (!data.items.length) {
      currentGate = {
        decidingFactor: message(
          "A data migration inventory has not been recorded yet.",
          "Ein Datenmigrations-Inventar wurde noch nicht erfasst."
        ),
        nextAction: message(
          "Record the important data categories, their migration methods and a verified backup or restore path.",
          "Die wichtigen Datenkategorien, ihre Migrationsmethoden und einen geprüften Backup- oder Wiederherstellungsweg erfassen."
        )
      };
    } else {
      currentGate = {
        decidingFactor: message(
          "The data plan still lacks a verified backup or contains an essential item that must not be assumed.",
          "Im Datenplan fehlt noch ein geprüftes Backup oder er enthält einen unverzichtbaren Punkt, der nicht angenommen werden darf."
        ),
        nextAction: message(
          "Resolve the essential data item and record a representative backup or restore check before removing Windows.",
          "Den unverzichtbaren Datenpunkt klären und vor dem Entfernen von Windows eine repräsentative Backup- oder Wiederherstellungsprüfung erfassen."
        )
      };
    }

    reasons.push(
      message(
        "No hard blocker is recorded, but the remaining checks still matter before Windows is removed.",
        "Es ist kein harter Blocker erfasst, doch die offenen Prüfungen sind vor dem Entfernen von Windows weiterhin wichtig."
      )
    );
    return {
      state: "ready_with_checks",
      strategy:
        passport.answers.migrationMode === "dual_boot"
          ? "dual_boot"
          : passport.answers.migrationMode === "test"
            ? "test_first"
            : "keep_windows_temporarily",
      currentGate,
      reasons,
      checks,
      blockers
    };
  }

  return {
    state: "ready",
    strategy:
      passport.answers.migrationMode === "dual_boot"
        ? "dual_boot"
        : passport.answers.migrationMode === "test"
          ? "test_first"
          : "linux_primary",
    currentGate: {
      decidingFactor: message(
        "No current hard blocker or unresolved required evidence is preventing readiness.",
        "Kein aktueller harter Blocker und keine offene benötigte Evidenz verhindern die Bereitschaft."
      )
    },
    reasons: [
      message(
        "No hard blocker or unresolved required evidence is recorded.",
        "Es ist kein harter Blocker und keine offene benötigte Evidenz erfasst."
      )
    ],
    checks,
    blockers
  };
}

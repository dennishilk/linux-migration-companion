import { liveTestDefinitions } from "../data/liveTests";
import type {
  LocalizedText,
  MigrationPassport,
  ReadinessAssessment,
  SoftwareAssessment
} from "../domain/types";
import { buildDataMigrationAssessment } from "./dataMigration";

const message = (en: string, de: string): LocalizedText => ({ en, de });

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

  const requiredHardware = Object.entries(passport.hardware.evidence).filter(
    ([, evidence]) => evidence.required
  );
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
    return {
      state: "blocked",
      strategy: software.blockers.length
        ? "keep_windows_for_workflows"
        : "migration_blocked",
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
      reasons,
      checks,
      blockers
    };
  }

  if (noEvidence) {
    return {
      state: "insufficient_evidence",
      strategy: "test_first",
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
    reasons.push(
      message(
        "Required hardware remains unknown or user-reported rather than live verified.",
        "Benötigte Hardware ist noch unbekannt oder nur vom Nutzer angegeben statt live bestätigt."
      )
    );
    return {
      state: "live_test_required",
      strategy: passport.answers.migrationMode === "dual_boot" ? "dual_boot" : "test_first",
      reasons,
      checks,
      blockers
    };
  }

  if (software.tradeoffs.length || checks.length) {
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

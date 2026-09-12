import { hardwareClassById } from "../data/hardware";
import { liveTestDefinitions } from "../data/liveTests";
import type {
  DistroRecommendation,
  HardwareClassId,
  HardwareEvidence,
  Locale,
  LocalizedText,
  MigrationPassport,
  MigrationStrategy,
  MigrationSummary,
  ReadinessAssessment,
  ReadinessState,
  SoftwareAssessment
} from "../domain/types";
import { buildDataMigrationAssessment } from "./dataMigration";

const message = (en: string, de: string): LocalizedText => ({ en, de });

const statusLabels: Record<ReadinessState, LocalizedText> = {
  ready: message("READY", "BEREIT"),
  ready_with_checks: message("READY WITH CHECKS", "BEREIT MIT PRÜFUNGEN"),
  live_test_required: message("LIVE TEST REQUIRED", "LIVE-TEST ERFORDERLICH"),
  windows_should_be_retained: message(
    "WINDOWS SHOULD BE RETAINED",
    "WINDOWS SOLLTE BEIBEHALTEN WERDEN"
  ),
  blocked: message("BLOCKED", "BLOCKIERT"),
  insufficient_evidence: message(
    "INSUFFICIENT EVIDENCE",
    "UNZUREICHENDE EVIDENZ"
  )
};

const strategyLabels: Record<MigrationStrategy, LocalizedText> = {
  linux_primary: message("Linux primary", "Linux als Hauptsystem"),
  test_first: message("Test Linux first", "Linux zuerst testen"),
  dual_boot: message("Dual boot", "Dual Boot"),
  keep_windows_temporarily: message(
    "Keep Windows temporarily",
    "Windows vorerst behalten"
  ),
  keep_windows_for_workflows: message(
    "Keep Windows for specific workflows",
    "Windows für bestimmte Arbeitsabläufe behalten"
  ),
  migration_blocked: message("Migration blocked", "Migration blockiert")
};

const shareCopy = {
  en: {
    title: "Linux Migration Companion — Migration Summary",
    status: "Status",
    strategy: "Strategy",
    ready: "Already ready",
    verify: "Still to verify",
    blockers: "Blockers",
    distros: "Suggested distributions",
    actions: "Next actions",
    noneReady: "No readiness claim is supported yet.",
    noneVerify: "No required verification is currently open.",
    noneBlockers:
      "No active blocker is recorded; remaining unknowns and checks still matter.",
    noneDistros: "No suitable distribution candidate is currently available.",
    noneActions: "No additional action is currently derived.",
    generated: "Generated locally by Linux Migration Companion."
  },
  de: {
    title: "Linux Migration Companion — Migrationsübersicht",
    status: "Status",
    strategy: "Strategie",
    ready: "Bereits bereit",
    verify: "Noch zu prüfen",
    blockers: "Blocker",
    distros: "Vorgeschlagene Distributionen",
    actions: "Nächste Schritte",
    noneReady: "Noch ist keine Bereitschaftsaussage ausreichend belegt.",
    noneVerify: "Derzeit ist keine erforderliche Prüfung offen.",
    noneBlockers:
      "Kein aktiver Blocker ist erfasst; verbleibende Unklarheiten und Prüfungen sind weiterhin wichtig.",
    noneDistros: "Derzeit ist kein geeigneter Distributionskandidat verfügbar.",
    noneActions: "Derzeit wird kein zusätzlicher Schritt abgeleitet.",
    generated: "Lokal mit Linux Migration Companion erstellt."
  }
};

function uniqueMessages(items: LocalizedText[]): LocalizedText[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.en}\u0000${item.de}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function suggestedDistros(
  passport: MigrationPassport,
  recommendations: DistroRecommendation[]
): MigrationSummary["suggestedDistros"] {
  const eligible = recommendations.filter(
    (recommendation) => recommendation.tier !== "not_recommended"
  );
  const selected = eligible.find(
    (recommendation) => recommendation.distro.id === passport.selectedDistroId
  );
  const ordered = selected
    ? [selected, ...eligible.filter((item) => item !== selected)]
    : eligible;

  return ordered.slice(0, 3).map(({ distro }) => ({
    id: distro.id,
    name: distro.name
  }));
}

export function buildMigrationSummary(
  passport: MigrationPassport,
  recommendations: DistroRecommendation[],
  software: SoftwareAssessment,
  readiness: ReadinessAssessment
): MigrationSummary {
  const data = buildDataMigrationAssessment(passport.dataMigration);
  const hardwareEvidence = Object.entries(passport.hardware.evidence) as [
    HardwareClassId,
    HardwareEvidence
  ][];
  const requiredHardware = hardwareEvidence.filter(
    ([, evidence]) => evidence.required
  );
  const verifiedRequiredHardware = requiredHardware.filter(
    ([, evidence]) => evidence.state === "live_verified"
  );
  const failedRequiredHardware = requiredHardware.filter(([, evidence]) =>
    ["failed_test", "known_issue"].includes(evidence.state)
  );
  const unresolvedRequiredHardware = requiredHardware.filter(([, evidence]) =>
    ["unknown", "known_fact", "user_reported"].includes(evidence.state)
  );
  const essentialLiveTests = liveTestDefinitions.filter(
    (definition) => definition.essential
  );
  const completedEssentialLiveTests = essentialLiveTests.filter((definition) =>
    ["works", "not_applicable"].includes(passport.liveTests[definition.id])
  );
  const untestedEssentialLiveTests = essentialLiveTests.filter(
    (definition) => passport.liveTests[definition.id] === "not_tested"
  );
  const liveIssues = liveTestDefinitions.filter(
    (definition) => passport.liveTests[definition.id] === "issue"
  );
  const distros = suggestedDistros(passport, recommendations);

  const readyItems: LocalizedText[] = [];
  if (software.items.length > 0) {
    readyItems.push(
      message(
        "The selected software workflows have been assessed.",
        "Die ausgewählten Software-Arbeitsabläufe wurden bewertet."
      )
    );
    if (software.blockers.length === 0) {
      readyItems.push(
        message(
          "No hard software blocker is recorded for the assessed workflows.",
          "Für die bewerteten Arbeitsabläufe ist kein harter Software-Blocker erfasst."
        )
      );
    }
  }
  if (
    requiredHardware.length > 0 &&
    verifiedRequiredHardware.length === requiredHardware.length
  ) {
    readyItems.push(
      message(
        "All required hardware is live verified.",
        "Die gesamte benötigte Hardware ist live bestätigt."
      )
    );
  }
  if (
    completedEssentialLiveTests.length === essentialLiveTests.length &&
    essentialLiveTests.some(
      (definition) => passport.liveTests[definition.id] === "works"
    )
  ) {
    readyItems.push(
      message(
        "All essential live-session checks are completed without a recorded issue.",
        "Alle wichtigen Live-Session-Prüfungen sind ohne erfasstes Problem abgeschlossen."
      )
    );
  }
  if (data.evidenceComplete) {
    readyItems.push(
      message(
        "A data migration inventory and backup path are recorded.",
        "Ein Datenmigrations-Inventar und ein Backup-Weg sind erfasst."
      )
    );
  }
  if (distros.length > 0) {
    readyItems.push(
      message(
        "Suitable distribution candidates have been identified from the recorded preferences.",
        "Passende Distributionskandidaten wurden aus den erfassten Vorlieben ermittelt."
      )
    );
  }

  const derivedBlockers: LocalizedText[] = [
    ...software.blockers.map((item) =>
      message(
        `${item.record.name} blocks migration because the recorded essential workflow has no supported equivalent.`,
        `${item.record.name} blockiert die Migration, weil der erfasste unverzichtbare Arbeitsablauf keinen unterstützten Ersatz hat.`
      )
    ),
    ...failedRequiredHardware.map(([id, evidence]) => {
      const title = hardwareClassById.get(id)!.title;
      return evidence.state === "known_issue"
        ? message(
            `Required hardware has a known issue: ${title.en}.`,
            `Benötigte Hardware hat ein bekanntes Problem: ${title.de}.`
          )
        : message(
            `Required hardware failed a representative test: ${title.en}.`,
            `Benötigte Hardware ist bei einem repräsentativen Test fehlgeschlagen: ${title.de}.`
          );
    }),
    ...liveIssues.map((definition) =>
      message(
        `A live-session test recorded an issue: ${definition.title.en}.`,
        `Eine Live-Session-Prüfung hat ein Problem ergeben: ${definition.title.de}.`
      )
    )
  ];
  const blockers =
    derivedBlockers.length > 0 ? derivedBlockers : readiness.blockers;

  const stillToVerify = uniqueMessages([
    ...(readiness.state !== "ready" && readiness.state !== "blocked"
      ? [readiness.currentGate.decidingFactor]
      : []),
    ...readiness.checks
  ]).slice(0, 5);

  const nextActions: LocalizedText[] = [];
  if (readiness.currentGate.nextAction) {
    nextActions.push(readiness.currentGate.nextAction);
  }
  if (software.blockers.length > 1) {
    const additionalBlockers = software.blockers
      .slice(1)
      .map((item) => item.record.name)
      .join(", ");
    nextActions.push(
      message(
        `Keep Windows for the other blocked workflows until supported replacements are verified: ${additionalBlockers}.`,
        `Windows für die weiteren blockierten Arbeitsabläufe behalten, bis unterstützte Ersatzwege bestätigt sind: ${additionalBlockers}.`
      )
    );
  }
  const failedHardwareActions =
    readiness.state === "blocked" && software.blockers.length === 0
      ? failedRequiredHardware.slice(1)
      : failedRequiredHardware;
  if (failedHardwareActions.length > 0) {
    const names = failedHardwareActions.map(([id]) => hardwareClassById.get(id)!.title);
    nextActions.push(
      message(
        `Resolve and retest the other required hardware issues before installation: ${names.map((title) => title.en).join(", ")}.`,
        `Die weiteren Probleme mit benötigter Hardware vor der Installation lösen und erneut testen: ${names.map((title) => title.de).join(", ")}.`
      )
    );
  }
  const unresolvedHardwareActions =
    readiness.state === "live_test_required"
      ? unresolvedRequiredHardware.slice(1)
      : unresolvedRequiredHardware;
  if (unresolvedHardwareActions.length > 0) {
    const names = unresolvedHardwareActions.map(
      ([id]) => hardwareClassById.get(id)!.title
    );
    nextActions.push(
      message(
        `Test the remaining required hardware in a Linux live session and record the results: ${names.map((title) => title.en).join(", ")}.`,
        `Die verbleibende benötigte Hardware in einer Linux-Live-Session testen und die Ergebnisse erfassen: ${names.map((title) => title.de).join(", ")}.`
      )
    );
  }
  const coveredLiveTestIds = new Set(
    unresolvedRequiredHardware.flatMap(([id]) => {
      const liveTestId = hardwareClassById.get(id)?.liveTestId;
      return liveTestId ? [liveTestId] : [];
    })
  );
  const uncoveredEssentialLiveTests = untestedEssentialLiveTests.filter(
    (definition) => !coveredLiveTestIds.has(definition.id)
  );
  const essentialLiveActions =
    readiness.state === "live_test_required" && unresolvedRequiredHardware.length === 0
      ? uncoveredEssentialLiveTests.slice(1)
      : uncoveredEssentialLiveTests;
  if (essentialLiveActions.length > 0) {
    nextActions.push(
      message(
        `Complete the remaining essential live-session checks: ${essentialLiveActions.map((definition) => definition.title.en).join(", ")}.`,
        `Die verbleibenden wichtigen Live-Session-Prüfungen abschließen: ${essentialLiveActions.map((definition) => definition.title.de).join(", ")}.`
      )
    );
  }
  const currentGateCoversData =
    readiness.state === "ready_with_checks" &&
    software.tradeoffs.length === 0 &&
    passport.answers.gaming === "none" &&
    !data.evidenceComplete;
  if (!data.evidenceComplete && !currentGateCoversData) {
    nextActions.push(
      data.items.length === 0
        ? message(
            "Record the important data categories, migration methods and a verified backup or restore path.",
            "Die wichtigen Datenkategorien, Migrationsmethoden und einen geprüften Backup- oder Wiederherstellungsweg erfassen."
          )
        : message(
            "Complete the data plan and verify a backup or restore path before installation.",
            "Den Datenplan vervollständigen und vor der Installation einen Backup- oder Wiederherstellungsweg prüfen."
          )
    );
  }
  if (
    !passport.mediaProgress.verify ||
    !passport.mediaProgress.write ||
    !passport.mediaProgress.test
  ) {
    nextActions.push(
      message(
        "Prepare and test the installation media using the official download and verification guidance before changing internal disks.",
        "Das Installationsmedium vor Änderungen an internen Datenträgern mit den offiziellen Download- und Prüfanleitungen vorbereiten und testen."
      )
    );
  }

  return {
    overallState: readiness.state,
    strategy: readiness.strategy,
    readyItems: uniqueMessages(readyItems),
    stillToVerify,
    blockers: uniqueMessages(blockers),
    suggestedDistros: distros,
    nextActions: uniqueMessages(nextActions).slice(0, 5)
  };
}

export function migrationSummaryStatus(
  state: ReadinessState,
  locale: Locale
): string {
  return statusLabels[state][locale];
}

export function migrationSummaryStrategy(
  strategy: MigrationStrategy,
  locale: Locale
): string {
  return strategyLabels[strategy][locale];
}

export function formatMigrationSummary(
  summary: MigrationSummary,
  locale: Locale
): string {
  const labels = shareCopy[locale];
  const localized = (items: LocalizedText[], fallback: string) =>
    items.length ? items.map((item) => item[locale]) : [fallback];
  const bullets = (items: string[]) => items.map((item) => `- ${item}`);
  const actions = localized(summary.nextActions, labels.noneActions).map(
    (item, index) => `${index + 1}. ${item}`
  );

  return [
    labels.title,
    "",
    `${labels.status}:`,
    migrationSummaryStatus(summary.overallState, locale),
    "",
    `${labels.strategy}:`,
    migrationSummaryStrategy(summary.strategy, locale),
    "",
    `${labels.ready}:`,
    ...bullets(localized(summary.readyItems, labels.noneReady)),
    "",
    `${labels.verify}:`,
    ...bullets(localized(summary.stillToVerify, labels.noneVerify)),
    "",
    `${labels.blockers}:`,
    ...bullets(localized(summary.blockers, labels.noneBlockers)),
    "",
    `${labels.distros}:`,
    ...bullets(
      summary.suggestedDistros.length
        ? summary.suggestedDistros.map((distro) => distro.name)
        : [labels.noneDistros]
    ),
    "",
    `${labels.actions}:`,
    ...actions,
    "",
    labels.generated
  ].join("\n");
}

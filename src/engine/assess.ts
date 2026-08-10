import { softwareById } from "../data/software";
import type {
  LiveReadiness,
  LiveTestResults,
  MigrationRisk,
  SoftwareAssessment,
  SoftwareAssessmentItem,
  SoftwareSelections
} from "../domain/types";

const riskOrder: Record<MigrationRisk, number> = {
  low: 0,
  medium: 1,
  high: 2,
  blocker: 3
};

export function assessSoftware(
  selections: SoftwareSelections
): SoftwareAssessment {
  const items: SoftwareAssessmentItem[] = Object.entries(selections)
    .flatMap(([id, priority]) => {
      const record = softwareById.get(id);
      if (!record) return [];
      const risk: MigrationRisk =
        priority === "essential" && record.blockerWhenEssential
          ? "blocker"
          : record.baseRisk;
      return [{ record, priority, risk }];
    })
    .sort((a, b) => riskOrder[b.risk] - riskOrder[a.risk]);

  const blockers = items.filter((item) => item.risk === "blocker");
  const tradeoffs = items.filter(
    (item) => item.risk === "high" || item.risk === "medium"
  );
  return {
    items,
    blockers,
    tradeoffs,
    overall: blockers.length
      ? "blocked"
      : tradeoffs.length
        ? "review"
        : "ready"
  };
}

export function assessLiveReadiness(results: LiveTestResults): LiveReadiness {
  const values = Object.values(results);
  if (values.includes("issue")) return "blocked";
  if (values.includes("not_tested")) return "incomplete";
  return "ready";
}

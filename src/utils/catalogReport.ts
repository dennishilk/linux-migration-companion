const NEW_ISSUE_URL =
  "https://github.com/dennishilk/linux-migration-companion/issues/new";

export type CatalogReportType = "Software" | "Distro";

export interface CatalogReportContext {
  type: CatalogReportType;
  name: string;
  id: string;
  reviewedAt: string;
  sourceUrl: string;
}

export function buildCatalogReportUrl(context: CatalogReportContext): string {
  const title = `[Catalog feedback] ${context.type}: ${context.name}`;
  const body = [
    `Catalog type: ${context.type}`,
    `Name: ${context.name}`,
    `ID: ${context.id}`,
    `Reviewed at: ${context.reviewedAt}`,
    `Current source URL: ${context.sourceUrl}`,
    "",
    "What appears outdated or incorrect:",
    "",
    "Suggested/current evidence:"
  ].join("\n");
  const query = new URLSearchParams({ title, body });

  return `${NEW_ISSUE_URL}?${query.toString()}`;
}

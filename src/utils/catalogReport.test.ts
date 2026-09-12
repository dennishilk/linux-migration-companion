import { describe, expect, it } from "vitest";
import { buildCatalogReportUrl } from "./catalogReport";

describe("catalog correction issue URLs", () => {
  it("encodes software metadata and only creates the intended issue fields", () => {
    const url = new URL(
      buildCatalogReportUrl({
        type: "Software",
        name: "C++ & .NET / Tools?",
        id: "c++ & tools/ß",
        reviewedAt: "2026-08-11",
        sourceUrl: "https://example.com/docs?q=C++&lang=de"
      })
    );

    expect(url.origin + url.pathname).toBe(
      "https://github.com/dennishilk/linux-migration-companion/issues/new"
    );
    expect([...url.searchParams.keys()]).toEqual(["title", "body"]);
    expect(url.searchParams.get("title")).toBe(
      "[Catalog feedback] Software: C++ & .NET / Tools?"
    );
    expect(url.searchParams.get("body")).toContain("Catalog type: Software");
    expect(url.searchParams.get("body")).toContain("ID: c++ & tools/ß");
    expect(url.searchParams.get("body")).toContain(
      "Current source URL: https://example.com/docs?q=C++&lang=de"
    );
    expect(url.href).toContain("C%2B%2B");
    expect(url.href).toContain("%C3%9F");
  });

  it("encodes distro metadata without application or device state", () => {
    const url = new URL(
      buildCatalogReportUrl({
        type: "Distro",
        name: "Example Linux — KDE & GNOME",
        id: "example-linux",
        reviewedAt: "2026-08-13",
        sourceUrl: "https://example.org/releases/current?edition=kde&arch=x86_64"
      })
    );
    const serialized = decodeURIComponent(url.href);

    expect(url.searchParams.get("body")).toContain("Catalog type: Distro");
    expect(url.searchParams.get("body")).toContain("Name: Example Linux — KDE & GNOME");
    expect(serialized).not.toMatch(
      /Migration Passport|hardware|browser|device|selected applications/i
    );
  });
});

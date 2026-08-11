import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

function schema(name: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(resolve(cwd(), "schemas", name), "utf8")
  ) as Record<string, unknown>;
}

describe("published JSON schema contracts", () => {
  it("publishes Passport v3 with embedded hardware snapshot provenance", () => {
    const passport = schema("migration-passport.schema.json");
    expect(passport.title).toBe("Linux Migration Companion Passport v3");
    expect(JSON.stringify(passport)).toContain('"schemaVersion":{"const":3}');
    expect(JSON.stringify(passport)).toContain("storedHardwareSnapshot");
    expect(JSON.stringify(passport)).toContain("hardware-snapshot.schema.json");
  });

  it("publishes strict Hardware Snapshot v1 bounds and source pairs", () => {
    const snapshot = schema("hardware-snapshot.schema.json");
    const compact = JSON.stringify(snapshot);
    expect(snapshot.title).toBe("Linux Migration Companion Hardware Snapshot v1");
    expect(compact).toContain('"schemaVersion":{"const":1}');
    expect(compact).toContain('"maxItems":64');
    expect(compact).toContain("browser-snapshot");
    expect(compact).toContain("windows-powershell");
    expect(compact).toContain("linux-python");
    expect(compact).toContain('"additionalProperties":false');
  });
});

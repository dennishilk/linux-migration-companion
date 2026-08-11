import { createHash } from "node:crypto";
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
    expect(compact).toContain("windows-dotnet");
    expect(compact).toContain("windows-powershell");
    expect(compact).toContain("linux-python");
    expect(compact).toContain('"additionalProperties":false');
  });

  it("publishes the CI-built Windows executable with its exact SHA-256", () => {
    const artifactDirectory = resolve(cwd(), "public", "collectors", "windows");
    const artifactName = "LinuxMigrationCompanion-HardwareSnapshot.exe";
    const executable = readFileSync(resolve(artifactDirectory, artifactName));
    const publishedChecksum = readFileSync(
      resolve(artifactDirectory, `${artifactName}.sha256`),
      "utf8"
    ).trim();
    const digest = createHash("sha256").update(executable).digest("hex");

    expect(executable.subarray(0, 2).toString("ascii")).toBe("MZ");
    expect(executable.byteLength).toBe(39_936);
    expect(digest).toBe("19b69cfe8c9ebfa22ce3e002af734a036dfc102e8934c47fb70cf5a201602ea7");
    expect(publishedChecksum).toBe(`${digest}  ${artifactName}`);
  });
});

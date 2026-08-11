import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";
import { makeWindowsSnapshot } from "../test/hardwareFixtures";
import {
  findProhibitedSnapshotPaths,
  parseHardwareSnapshotText
} from "./snapshotSchema";

const linuxCollector = resolve(
  cwd(),
  "public/collectors/linux/collect-linux-hardware.py"
);
const windowsCollector = resolve(
  cwd(),
  "public/collectors/windows/Collect-LinuxMigrationHardware.ps1"
);

describe("auditable read-only hardware collectors", () => {
  it("runs the Linux collector without root and validates its stdout", () => {
    const output = execFileSync("python3", [linuxCollector, "--stdout"], {
      encoding: "utf8",
      timeout: 15_000,
      maxBuffer: 256 * 1024
    });
    const snapshot = parseHardwareSnapshotText(output);
    expect(snapshot.source).toBe("linux_collector");
    expect(snapshot.collector).toEqual({ id: "linux-python", version: "1.0.0" });
    expect(findProhibitedSnapshotPaths(snapshot)).toEqual([]);
  });

  it("keeps the Linux collector free of command, network, package and privilege execution", () => {
    const source = readFileSync(linuxCollector, "utf8");
    expect(source).not.toMatch(/\bsubprocess\b|os\.system|os\.popen|shell\s*=|socket\.|requests\.|urllib\.|apt\b|dnf\b|pacman\b|sudo\b.*(?:run|exec)/i);
    expect(source).not.toMatch(/\/home\/|\/root\/|\/etc\/hostname|\/etc\/machine-id|\/proc\/[^"']*environ|\/address["']/i);
    expect(source).toContain("os.O_EXCL");
    expect(source).toContain("os.O_NOFOLLOW");
    expect(source).not.toContain("follow_symlinks=True");
  });

  it("limits Linux reads to documented system metadata roots", () => {
    const source = readFileSync(linuxCollector, "utf8");
    const absolutePaths = [...source.matchAll(/Path\("(\/[^"\n]+)"\)/g)].map(
      (match) => match[1]
    );
    expect(absolutePaths.length).toBeGreaterThan(5);
    expect(
      absolutePaths.every(
        (path) =>
          path === "/etc/os-release" ||
          path.startsWith("/proc/") ||
          path.startsWith("/sys/")
      )
    ).toBe(true);
  });

  it("uses only explicit Windows CIM property allowlists and no raw class dumps", () => {
    const source = readFileSync(windowsCollector, "utf8");
    const queries = [...source.matchAll(/"(SELECT [^"]+ FROM [^"]+)"/g)].map(
      (match) => match[1]
    );
    expect(queries.length).toBeGreaterThanOrEqual(10);
    expect(queries.every((query) => !query.includes("*"))).toBe(true);
    expect(queries.join("\n")).not.toMatch(
      /SerialNumber|MACAddress|IPAddress|NetConnectionID|DNSHostName|UserName|PNPDeviceID|DeviceID|SystemName|Name FROM Win32_ComputerSystem/i
    );
  });

  it("keeps the Windows collector read-only, offline and non-elevating", () => {
    const source = readFileSync(windowsCollector, "utf8");
    expect(source).not.toMatch(
      /Invoke-WebRequest|Invoke-RestMethod|Start-BitsTransfer|Set-CimInstance|Remove-CimInstance|Set-ItemProperty|New-ItemProperty|Remove-Item|Start-Process|RunAs|Confirm-SecureBootUEFI\s+-|ExecutionPolicy\s+(?:Bypass|Unrestricted)|diskpart|bcdedit|mountvol/i
    );
    expect(source).not.toMatch(/SELECT \*/i);
    expect(source).toContain("[IO.FileMode]::CreateNew");
    expect(source).toContain("Assert-PrivacyKeys");
  });

  it("validates the deterministic Windows output contract and privacy self-check", () => {
    const snapshot = parseHardwareSnapshotText(JSON.stringify(makeWindowsSnapshot()));
    expect(snapshot.source).toBe("windows_collector");
    expect(findProhibitedSnapshotPaths(snapshot)).toEqual([]);
    expect(snapshot.facts.some((fact) => fact.category === "wifi")).toBe(true);
    expect(snapshot.facts.some((fact) => fact.category === "graphics")).toBe(true);
  });

  it("contains deterministic collector-side prohibited-key checks", () => {
    for (const path of [linuxCollector, windowsCollector]) {
      const source = readFileSync(path, "utf8").toLowerCase();
      for (const field of [
        "username",
        "hostname",
        "serialnumber",
        "macaddress",
        "ipaddress",
        "ssid",
        "productkey",
        "machineguid"
      ]) {
        expect(source, `${path}: ${field}`).toContain(field);
      }
    }
  });

  it("keeps both collector outputs within the public schema bounds", () => {
    const linuxSource = readFileSync(linuxCollector, "utf8");
    const windowsSource = readFileSync(windowsCollector, "utf8");
    expect(linuxSource).toContain("MAX_FACTS = 64");
    expect(linuxSource).toContain("0.25 <= memory <= 16384");
    expect(linuxSource).toContain("min(connected_displays, 64)");
    expect(windowsSource).toContain('$MaximumFacts = 64');
    expect(windowsSource).toContain('$Facts.Count -ge $MaximumFacts');
    expect(windowsSource).toContain('$LogicalProcessors -le 4096');
    expect(windowsSource).toContain('$MemoryGiB -le 16384');
    expect(windowsSource).toContain('[Math]::Min($ConnectedDisplays, 64)');
  });
});

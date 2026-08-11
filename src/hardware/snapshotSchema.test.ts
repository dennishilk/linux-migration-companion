import { describe, expect, it } from "vitest";
import {
  makeLinuxSnapshot,
  makeWindowsExeSnapshot,
  makeWindowsSnapshot
} from "../test/hardwareFixtures";
import {
  MAX_HARDWARE_SNAPSHOT_BYTES,
  findProhibitedSnapshotPaths,
  hardwareSnapshotSchema,
  parseHardwareSnapshotText,
  serializeHardwareSnapshot
} from "./snapshotSchema";

describe("hardware snapshot schema", () => {
  it("validates and round-trips a Windows collector snapshot", () => {
    const snapshot = makeWindowsSnapshot();
    expect(parseHardwareSnapshotText(serializeHardwareSnapshot(snapshot))).toEqual(snapshot);
  });

  it("validates and round-trips the primary Windows executable snapshot", () => {
    const snapshot = makeWindowsExeSnapshot();
    expect(parseHardwareSnapshotText(serializeHardwareSnapshot(snapshot))).toEqual(snapshot);
  });

  it("validates a Linux collector snapshot with non-unique PCI and USB IDs", () => {
    expect(hardwareSnapshotSchema.parse(makeLinuxSnapshot())).toEqual(makeLinuxSnapshot());
  });

  it("accepts multiple distinct network adapters without merging them", () => {
    const snapshot = makeWindowsSnapshot();
    snapshot.facts.push({
      category: "wifi",
      name: "USB Wi-Fi adapter",
      vendor: "Second vendor"
    });
    const parsed = parseHardwareSnapshotText(JSON.stringify(snapshot));
    expect(parsed.facts.filter((fact) => fact.category === "wifi")).toHaveLength(2);
    expect(parsed.facts.filter((fact) => fact.category === "ethernet")).toHaveLength(1);
  });

  it("accepts missing optional system facts and no detected hardware", () => {
    const snapshot = makeLinuxSnapshot();
    snapshot.system = {
      osFamily: "linux",
      architecture: "unknown",
      formFactor: "unknown",
      firmware: "unknown",
      secureBoot: "unavailable",
      virtualization: "unknown"
    };
    snapshot.facts = [];
    expect(hardwareSnapshotSchema.safeParse(snapshot).success).toBe(true);
  });

  it("accepts unknown and Unicode device names only as inert bounded text", () => {
    const snapshot = makeLinuxSnapshot();
    snapshot.facts[0].name = "未知 GPU — Gerät Ω /tmp/not-a-command";
    expect(parseHardwareSnapshotText(JSON.stringify(snapshot)).facts[0].name).toBe(
      snapshot.facts[0].name
    );
  });

  it("keeps markup-like device text as data without interpreting it", () => {
    const snapshot = makeWindowsSnapshot();
    snapshot.facts[0].name = '<img src=x onerror="alert(1)"><script>bad()</script>';
    const parsed = parseHardwareSnapshotText(JSON.stringify(snapshot));
    expect(parsed.facts[0].name).toBe(snapshot.facts[0].name);
  });

  it("rejects an unknown schema version", () => {
    expect(() =>
      parseHardwareSnapshotText(
        JSON.stringify({ ...makeWindowsSnapshot(), schemaVersion: 2 })
      )
    ).toThrow("snapshot_schema_invalid");
  });

  it("rejects files over 128 KiB before JSON parsing", () => {
    expect(() =>
      parseHardwareSnapshotText("x".repeat(MAX_HARDWARE_SNAPSHOT_BYTES + 1))
    ).toThrow("snapshot_too_large");
  });

  it("rejects excessive nesting before schema use", () => {
    let nested: unknown = "leaf";
    for (let index = 0; index < 12; index += 1) nested = { child: nested };
    expect(() =>
      parseHardwareSnapshotText(
        JSON.stringify({ ...makeWindowsSnapshot(), unexpected: nested })
      )
    ).toThrow("snapshot_too_deep");
  });

  it("rejects unexpected top-level and nested fact keys", () => {
    expect(() =>
      parseHardwareSnapshotText(
        JSON.stringify({ ...makeWindowsSnapshot(), uploadUrl: "https://example.invalid" })
      )
    ).toThrow("snapshot_schema_invalid");

    const snapshot = makeWindowsSnapshot() as ReturnType<typeof makeWindowsSnapshot> & {
      facts: Array<ReturnType<typeof makeWindowsSnapshot>["facts"][number] & { script?: string }>;
    };
    snapshot.facts[0].script = "run-me";
    expect(() => parseHardwareSnapshotText(JSON.stringify(snapshot))).toThrow(
      "snapshot_schema_invalid"
    );
  });

  it("rejects prototype-pollution-style keys before state entry", () => {
    const text = JSON.stringify(makeWindowsSnapshot()).replace(
      '"facts":',
      '"__proto__":{"polluted":true},"facts":'
    );
    expect(() => parseHardwareSnapshotText(text)).toThrow(
      "snapshot_prohibited_field"
    );
    expect(findProhibitedSnapshotPaths(JSON.parse(text) as unknown)).toContain(
      "$.__proto__"
    );
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("rejects overlong, control-containing and malformed-Unicode device names", () => {
    for (const name of ["x".repeat(161), "line\nbreak", "\ud800"]) {
      const snapshot = makeWindowsSnapshot();
      snapshot.facts[0].name = name;
      expect(
        () => parseHardwareSnapshotText(JSON.stringify(snapshot)),
        JSON.stringify(name)
      ).toThrow("snapshot_schema_invalid");
    }
  });

  it("rejects unknown hardware categories instead of widening the contract", () => {
    const snapshot = makeWindowsSnapshot();
    const value = JSON.parse(JSON.stringify(snapshot)) as {
      facts: Array<{ category: string }>;
    };
    value.facts[0].category = "future_device";
    expect(() => parseHardwareSnapshotText(JSON.stringify(value))).toThrow(
      "snapshot_schema_invalid"
    );
  });

  it("requires vendor and device IDs as a non-unique pair", () => {
    const snapshot = makeLinuxSnapshot();
    delete snapshot.facts[0].deviceId;
    expect(() => parseHardwareSnapshotText(JSON.stringify(snapshot))).toThrow(
      "snapshot_schema_invalid"
    );
  });

  it("rejects duplicate facts and more than 64 facts", () => {
    const duplicate = makeWindowsSnapshot();
    duplicate.facts.push({ ...duplicate.facts[0] });
    expect(() => parseHardwareSnapshotText(JSON.stringify(duplicate))).toThrow(
      "snapshot_schema_invalid"
    );

    const excessive = makeWindowsSnapshot();
    excessive.facts = Array.from({ length: 65 }, (_, index) => ({
      category: "special_usb" as const,
      name: `Device ${index}`
    }));
    expect(() => parseHardwareSnapshotText(JSON.stringify(excessive))).toThrow(
      "snapshot_schema_invalid"
    );
  });

  it("rejects contradictory collector/source claims", () => {
    const snapshot = makeWindowsSnapshot();
    snapshot.collector.id = "linux-python";
    expect(() => parseHardwareSnapshotText(JSON.stringify(snapshot))).toThrow(
      "snapshot_schema_invalid"
    );
  });

  it("requires browser capability provenance and prohibits browser device claims", () => {
    const snapshot = makeWindowsSnapshot();
    const browser = {
      ...snapshot,
      source: "browser_reported",
      collector: { id: "browser-snapshot", version: "1.0.0" }
    };
    expect(() => parseHardwareSnapshotText(JSON.stringify(browser))).toThrow(
      "snapshot_schema_invalid"
    );
  });

  it("prohibits browser-capability claims in collector output", () => {
    const snapshot = makeLinuxSnapshot() as ReturnType<typeof makeLinuxSnapshot> & {
      browserCapabilities?: unknown;
    };
    snapshot.browserCapabilities = {
      platform: "reported",
      hardwareConcurrency: "reported_reduced",
      deviceMemory: "reported_reduced",
      webgpu: "adapter_available"
    };
    expect(() => parseHardwareSnapshotText(JSON.stringify(snapshot))).toThrow(
      "snapshot_schema_invalid"
    );
  });

  it.each([
    "username",
    "hostname",
    "serial",
    "macAddress",
    "ipAddress",
    "ssid",
    "productKey",
    "machineGuid",
    "credentials"
  ])("rejects prohibited private field %s at any depth", (field) => {
    const snapshot = makeWindowsSnapshot();
    const value = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
    value.system = {
      ...(value.system as Record<string, unknown>),
      [field]: "must-not-enter-state"
    };
    expect(() => parseHardwareSnapshotText(JSON.stringify(value))).toThrow(
      "snapshot_prohibited_field"
    );
  });
});

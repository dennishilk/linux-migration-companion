import { z } from "zod";
import type {
  HardwareSnapshot,
  StoredHardwareSnapshot
} from "../domain/types";

export const MAX_HARDWARE_SNAPSHOT_BYTES = 128 * 1024;
const MAX_HARDWARE_SNAPSHOT_DEPTH = 8;

const PROHIBITED_NORMALIZED_KEYS = new Set([
  "username",
  "realname",
  "hostname",
  "computername",
  "accountname",
  "email",
  "emailaddress",
  "ipaddress",
  "macaddress",
  "ssid",
  "wifipassword",
  "networkhistory",
  "serial",
  "serialnumber",
  "systemserialnumber",
  "motherboardserialnumber",
  "diskserialnumber",
  "productkey",
  "activationid",
  "machineguid",
  "tpmendorsementidentifier",
  "browserhistory",
  "filename",
  "filenames",
  "directorylisting",
  "userfilecontents",
  "shellhistory",
  "environmentsecret",
  "token",
  "credentials",
  "sshkey",
  "sshkeys",
  "cloudaccount"
]);

const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function normalizedKey(key: string): string {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

export function findProhibitedSnapshotPaths(
  value: unknown,
  path = "$"
): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findProhibitedSnapshotPaths(item, `${path}[${index}]`)
    );
  }
  if (value === null || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const current = `${path}.${key}`;
    const unsafe =
      UNSAFE_OBJECT_KEYS.has(key) ||
      PROHIBITED_NORMALIZED_KEYS.has(normalizedKey(key));
    return [
      ...(unsafe ? [current] : []),
      ...findProhibitedSnapshotPaths(child, current)
    ];
  });
}

function valueDepth(value: unknown, depth = 0): number {
  if (depth > MAX_HARDWARE_SNAPSHOT_DEPTH) return depth;
  if (Array.isArray(value)) {
    return value.reduce(
      (maximum, child) => Math.max(maximum, valueDepth(child, depth + 1)),
      depth
    );
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).reduce(
      (maximum, child) => Math.max(maximum, valueDepth(child, depth + 1)),
      depth
    );
  }
  return depth;
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

const boundedText = (maximum: number) =>
  z
    .string()
    .min(1)
    .max(maximum)
    .refine((value) => !hasControlCharacter(value))
    .refine((value) => !hasUnpairedSurrogate(value));

const hardwareCategorySchema = z.enum([
  "graphics",
  "hybrid_graphics",
  "wifi",
  "bluetooth",
  "ethernet",
  "audio",
  "usb_audio",
  "webcam",
  "microphone",
  "fingerprint",
  "dock",
  "external_monitors",
  "hidpi",
  "printer",
  "scanner",
  "capture_device",
  "game_controller",
  "racing_wheel",
  "special_usb",
  "cpu",
  "storage",
  "usb_controller",
  "input_device",
  "display"
]);

const factSchema = z
  .object({
    category: hardwareCategorySchema,
    name: boundedText(160),
    vendor: boundedText(100).optional(),
    bus: z.enum(["pci", "usb", "platform", "unknown"]).optional(),
    vendorId: z.string().regex(/^[0-9a-f]{4}$/).optional(),
    deviceId: z.string().regex(/^[0-9a-f]{4}$/).optional()
  })
  .strict()
  .refine(
    (fact) =>
      (fact.vendorId === undefined && fact.deviceId === undefined) ||
      (fact.vendorId !== undefined && fact.deviceId !== undefined)
  );

const systemSchema = z
  .object({
    osFamily: z.enum(["windows", "linux", "other", "unknown"]),
    osLabel: boundedText(120).optional(),
    architecture: z.enum([
      "x86_64",
      "x86",
      "arm64",
      "arm",
      "other",
      "unknown"
    ]),
    formFactor: z.enum(["desktop", "laptop", "tablet", "virtual", "unknown"]),
    logicalProcessors: z.number().int().min(1).max(4096).optional(),
    memoryGiB: z.number().finite().min(0.25).max(16384).optional(),
    firmware: z.enum(["uefi", "legacy", "unknown"]),
    secureBoot: z.enum(["enabled", "disabled", "unavailable", "unknown"]),
    virtualization: z.enum(["enabled", "supported", "unavailable", "unknown"]),
    connectedDisplays: z.number().int().min(0).max(64).optional()
  })
  .strict();

const browserCapabilitiesSchema = z
  .object({
    platform: z.enum(["reported", "unavailable"]),
    hardwareConcurrency: z.enum(["reported_reduced", "unavailable"]),
    deviceMemory: z.enum(["reported_reduced", "unavailable"]),
    webgpu: z.enum([
      "adapter_available",
      "adapter_unavailable",
      "api_unavailable"
    ])
  })
  .strict();

export const hardwareSnapshotSchema: z.ZodType<HardwareSnapshot> = z
  .object({
    schemaVersion: z.literal(1),
    product: z.literal("linux-migration-companion-hardware-snapshot"),
    createdAt: z.string().datetime(),
    source: z.enum([
      "browser_reported",
      "windows_collector",
      "linux_collector"
    ]),
    collector: z
      .object({
        id: z.enum([
          "browser-snapshot",
          "windows-dotnet",
          "windows-powershell",
          "linux-python"
        ]),
        version: z
          .string()
          .max(32)
          .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
      })
      .strict(),
    system: systemSchema,
    browserCapabilities: browserCapabilitiesSchema.optional(),
    facts: z
      .array(factSchema)
      .max(64)
      .refine(
        (facts) =>
          new Set(
            facts.map((fact) =>
              [
                fact.category,
                fact.name,
                fact.vendor ?? "",
                fact.bus ?? "",
                fact.vendorId ?? "",
                fact.deviceId ?? ""
              ].join("\u0000")
            )
          ).size === facts.length
      )
  })
  .strict()
  .superRefine((snapshot, context) => {
    const expectedCollectors = {
      browser_reported: ["browser-snapshot"],
      windows_collector: ["windows-dotnet", "windows-powershell"],
      linux_collector: ["linux-python"]
    } as const;
    if (!(expectedCollectors[snapshot.source] as readonly string[]).includes(snapshot.collector.id)) {
      context.addIssue({
        code: "custom",
        message: "collector/source mismatch",
        path: ["collector", "id"]
      });
    }
    if (snapshot.source === "browser_reported") {
      if (!snapshot.browserCapabilities) {
        context.addIssue({
          code: "custom",
          message: "browser capabilities required",
          path: ["browserCapabilities"]
        });
      }
      if (snapshot.facts.length) {
        context.addIssue({
          code: "custom",
          message: "browser snapshots cannot claim detected devices",
          path: ["facts"]
        });
      }
    } else if (snapshot.browserCapabilities !== undefined) {
      context.addIssue({
        code: "custom",
        message: "collector snapshots cannot claim browser capabilities",
        path: ["browserCapabilities"]
      });
    }
  });

export const storedHardwareSnapshotSchema: z.ZodType<StoredHardwareSnapshot> = z
  .object({
    acquisition: z.enum(["browser_runtime", "file_import"]),
    acquiredAt: z.string().datetime(),
    snapshot: hardwareSnapshotSchema
  })
  .strict()
  .refine(
    (record) =>
      record.acquisition !== "browser_runtime" ||
      record.snapshot.source === "browser_reported"
  );

export function parseHardwareSnapshotText(text: string): HardwareSnapshot {
  if (new TextEncoder().encode(text).byteLength > MAX_HARDWARE_SNAPSHOT_BYTES) {
    throw new Error("snapshot_too_large");
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error("snapshot_invalid_json");
  }

  if (valueDepth(value) > MAX_HARDWARE_SNAPSHOT_DEPTH) {
    throw new Error("snapshot_too_deep");
  }

  if (findProhibitedSnapshotPaths(value).length) {
    throw new Error("snapshot_prohibited_field");
  }

  const parsed = hardwareSnapshotSchema.safeParse(value);
  if (!parsed.success) throw new Error("snapshot_schema_invalid");
  return parsed.data;
}

export function serializeHardwareSnapshot(snapshot: HardwareSnapshot): string {
  return JSON.stringify(hardwareSnapshotSchema.parse(snapshot), null, 2);
}

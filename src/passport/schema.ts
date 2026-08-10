import { z } from "zod";
import { distroById } from "../data/distros";
import { softwareById } from "../data/software";
import type { MigrationPassport } from "../domain/types";

const launcherSchema = z.enum([
  "steam",
  "battlenet",
  "epic",
  "xbox",
  "ea",
  "ubisoft",
  "riot",
  "vr"
]);

export const advisorAnswersSchema = z
  .object({
    currentWindows: z.enum(["windows10", "windows11", "other"]),
    deviceType: z.enum(["desktop", "laptop"]),
    experience: z.enum([
      "none",
      "beginner",
      "intermediate",
      "advanced",
      "expert"
    ]),
    terminalComfort: z.enum([
      "avoid",
      "guided",
      "comfortable",
      "enthusiast"
    ]),
    troubleshooting: z.enum([
      "avoid",
      "guided",
      "comfortable",
      "enthusiast"
    ]),
    maintenance: z.enum(["minimal", "regular", "active", "hobby"]),
    freshness: z.enum(["stable", "balanced", "newest"]),
    rollingTolerance: z.enum(["no", "maybe", "yes"]),
    desktopPreference: z.enum([
      "windows_like",
      "kde",
      "gnome",
      "no_preference",
      "build_my_own"
    ]),
    windowsLikeUi: z.enum(["important", "nice", "irrelevant"]),
    gaming: z.enum(["none", "casual", "important", "critical"]),
    gameLaunchers: z.array(launcherSchema).max(8),
    office: z.enum(["none", "basic", "complex"]),
    development: z.enum([
      "none",
      "web",
      "cross_platform",
      "microsoft_stack"
    ]),
    creative: z.enum(["none", "hobby", "professional"]),
    mediaProduction: z.enum(["none", "hobby", "professional"]),
    professionalDependencies: z.enum(["none", "replaceable", "essential"]),
    gpuVendor: z.enum(["unknown", "nvidia", "amd", "intel"]),
    secureBoot: z.enum(["required", "preferred", "irrelevant"]),
    proprietaryTolerance: z.enum([
      "avoid",
      "accept_if_needed",
      "comfortable"
    ]),
    systemInterest: z.enum([
      "use_it",
      "customize",
      "declarative",
      "manual_build",
      "compile_control"
    ]),
    migrationMode: z.enum(["test", "dual_boot", "replace"])
  })
  .strict();

const liveStatusSchema = z.enum([
  "not_tested",
  "works",
  "issue",
  "not_applicable"
]);

export const migrationPassportSchema = z
  .object({
    schemaVersion: z.literal(1),
    product: z.literal("linux-migration-companion"),
    locale: z.enum(["en", "de"]),
    updatedAt: z.string().datetime(),
    answers: advisorAnswersSchema,
    softwareSelections: z
      .record(z.string().max(80), z.enum(["important", "essential"]))
      .refine((value) => Object.keys(value).length <= 60)
      .refine((value) => Object.keys(value).every((id) => softwareById.has(id))),
    hardware: z
      .object({
        source: z.literal("manual"),
        gpuVendor: z.enum(["unknown", "nvidia", "amd", "intel"]),
        overall: z.enum([
          "verified",
          "probably_supported",
          "unknown",
          "known_issue",
          "proprietary_driver_required"
        ]),
        scannerStatus: z.literal("deferred"),
        notes: z.string().max(1000)
      })
      .strict(),
    liveTests: z
      .object({
        wifi: liveStatusSchema,
        ethernet: liveStatusSchema,
        graphics: liveStatusSchema,
        audio: liveStatusSchema,
        bluetooth: liveStatusSchema,
        suspend: liveStatusSchema,
        external_monitor: liveStatusSchema,
        webcam: liveStatusSchema,
        microphone: liveStatusSchema,
        printer: liveStatusSchema
      })
      .strict(),
    mediaProgress: z
      .object({
        download: z.boolean(),
        verify: z.boolean(),
        write: z.boolean(),
        boot: z.boolean(),
        test: z.boolean(),
        return: z.boolean()
      })
      .strict(),
    selectedDistroId: z
      .string()
      .max(80)
      .nullable()
      .refine((id) => id === null || distroById.has(id))
  })
  .strict();

export const MAX_PASSPORT_BYTES = 256 * 1024;
const MAX_DEPTH = 12;

function valueDepth(value: unknown, depth = 0): number {
  if (depth > MAX_DEPTH) return depth;
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

export function parsePassportText(text: string): MigrationPassport {
  if (new TextEncoder().encode(text).byteLength > MAX_PASSPORT_BYTES) {
    throw new Error("passport_too_large");
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error("passport_invalid_json");
  }

  if (valueDepth(value) > MAX_DEPTH) {
    throw new Error("passport_too_deep");
  }

  const parsed = migrationPassportSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("passport_schema_invalid");
  }
  return parsed.data;
}

export function serializePassport(passport: MigrationPassport): string {
  return JSON.stringify(migrationPassportSchema.parse(passport), null, 2);
}

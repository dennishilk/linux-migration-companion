import { z } from "zod";
import { distroById } from "../data/distros";
import { softwareById } from "../data/software";
import { createDefaultHardware, createDefaultPassport } from "../domain/defaults";
import { storedHardwareSnapshotSchema } from "../hardware/snapshotSchema";
import type {
  DataMigrationId,
  HardwareEvidenceState,
  MigrationPassport
} from "../domain/types";

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
    experience: z.enum(["none", "beginner", "intermediate", "advanced", "expert"]),
    terminalComfort: z.enum(["avoid", "guided", "comfortable", "enthusiast"]),
    troubleshooting: z.enum(["avoid", "guided", "comfortable", "enthusiast"]),
    maintenance: z.enum(["minimal", "regular", "active", "hobby"]),
    freshness: z.enum(["stable", "balanced", "newest"]),
    rollingTolerance: z.enum(["no", "maybe", "yes"]),
    desktopPreference: z.enum(["windows_like", "kde", "gnome", "no_preference", "build_my_own"]),
    windowsLikeUi: z.enum(["important", "nice", "irrelevant"]),
    gaming: z.enum(["none", "casual", "important", "critical"]),
    gameLaunchers: z
      .array(launcherSchema)
      .max(8)
      .refine((items) => new Set(items).size === items.length),
    office: z.enum(["none", "basic", "complex"]),
    development: z.enum(["none", "web", "cross_platform", "microsoft_stack"]),
    creative: z.enum(["none", "hobby", "professional"]),
    mediaProduction: z.enum(["none", "hobby", "professional"]),
    professionalDependencies: z.enum(["none", "replaceable", "essential"]),
    gpuVendor: z.enum(["unknown", "nvidia", "amd", "intel"]),
    secureBoot: z.enum(["required", "preferred", "irrelevant"]),
    proprietaryTolerance: z.enum(["avoid", "accept_if_needed", "comfortable"]),
    systemInterest: z.enum(["use_it", "customize", "declarative", "manual_build", "compile_control"]),
    migrationMode: z.enum(["test", "dual_boot", "replace"])
  })
  .strict();

const liveStatusSchema = z.enum(["not_tested", "works", "issue", "not_applicable"]);
const liveTestsSchema = z
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
  .strict();

const mediaProgressSchema = z
  .object({
    download: z.boolean(),
    verify: z.boolean(),
    write: z.boolean(),
    boot: z.boolean(),
    test: z.boolean(),
    return: z.boolean()
  })
  .strict();

const softwareSelectionsSchema = (maximum: number) =>
  z
    .record(z.string().max(80), z.enum(["important", "essential"]))
    .refine((value) => Object.keys(value).length <= maximum)
    .refine((value) => Object.keys(value).every((id) => softwareById.has(id)));

const distroIdSchema = z
  .string()
  .max(80)
  .refine((id) => distroById.has(id));

const evidenceStateSchema = z.enum([
  "unknown",
  "known_fact",
  "user_reported",
  "live_verified",
  "failed_test",
  "known_issue",
  "not_applicable"
]);

const evidenceSchema = z
  .object({
    state: evidenceStateSchema,
    required: z.boolean(),
    details: z.string().max(500)
  })
  .strict()
  .refine(
    (evidence) => !(evidence.required && evidence.state === "not_applicable")
  );

const hardwareEvidenceSchema = z
  .object({
    graphics: evidenceSchema,
    hybrid_graphics: evidenceSchema,
    wifi: evidenceSchema,
    bluetooth: evidenceSchema,
    ethernet: evidenceSchema,
    audio: evidenceSchema,
    usb_audio: evidenceSchema,
    webcam: evidenceSchema,
    microphone: evidenceSchema,
    fingerprint: evidenceSchema,
    dock: evidenceSchema,
    external_monitors: evidenceSchema,
    hidpi: evidenceSchema,
    printer: evidenceSchema,
    scanner: evidenceSchema,
    capture_device: evidenceSchema,
    game_controller: evidenceSchema,
    racing_wheel: evidenceSchema,
    special_usb: evidenceSchema
  })
  .strict();

const dataMigrationIds: DataMigrationId[] = [
  "documents",
  "photos",
  "videos",
  "browser_profile",
  "password_manager",
  "email",
  "outlook_archives",
  "cloud_storage",
  "onedrive",
  "google_drive",
  "dropbox",
  "steam_libraries",
  "game_saves",
  "ssh_keys",
  "git_repositories",
  "development_projects",
  "local_databases",
  "application_data",
  "backups"
];
const dataMigrationIdSet = new Set<string>(dataMigrationIds);

const dataMigrationSelectionSchema = z
  .object({
    importance: z.enum(["important", "essential"]),
    method: z.enum(["copy", "sync", "export_import", "reconfigure", "manual_check", "do_not_assume"]),
    notes: z.string().max(500)
  })
  .strict();

const dataMigrationSchema = z
  .record(z.string().max(80), dataMigrationSelectionSchema)
  .refine((value) => Object.keys(value).length <= dataMigrationIds.length)
  .refine((value) => Object.keys(value).every((id) => dataMigrationIdSet.has(id)));

const migrationPassportV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    product: z.literal("linux-migration-companion"),
    locale: z.enum(["en", "de"]),
    updatedAt: z.string().datetime(),
    answers: advisorAnswersSchema,
    softwareSelections: softwareSelectionsSchema(60),
    hardware: z
      .object({
        source: z.literal("manual"),
        gpuVendor: z.enum(["unknown", "nvidia", "amd", "intel"]),
        overall: z.enum(["verified", "probably_supported", "unknown", "known_issue", "proprietary_driver_required"]),
        scannerStatus: z.literal("deferred"),
        notes: z.string().max(1000)
      })
      .strict(),
    liveTests: liveTestsSchema,
    mediaProgress: mediaProgressSchema,
    selectedDistroId: distroIdSchema.nullable()
  })
  .strict();

const migrationPassportV2Schema = z
  .object({
    schemaVersion: z.literal(2),
    product: z.literal("linux-migration-companion"),
    locale: z.enum(["en", "de"]),
    updatedAt: z.string().datetime(),
    answers: advisorAnswersSchema,
    softwareSelections: softwareSelectionsSchema(100),
    hardware: z
      .object({
        source: z.literal("manual"),
        gpuVendor: z.enum(["unknown", "nvidia", "amd", "intel"]),
        scannerStatus: z.literal("deferred"),
        evidence: hardwareEvidenceSchema,
        notes: z.string().max(1000)
      })
      .strict(),
    liveTests: liveTestsSchema,
    mediaProgress: mediaProgressSchema,
    selectedDistroId: distroIdSchema.nullable(),
    comparisonDistroIds: z
      .array(distroIdSchema)
      .max(3)
      .refine((ids) => new Set(ids).size === ids.length),
    dataMigration: dataMigrationSchema
  })
  .strict();

export const migrationPassportSchema: z.ZodType<MigrationPassport> = z
  .object({
    schemaVersion: z.literal(3),
    product: z.literal("linux-migration-companion"),
    locale: z.enum(["en", "de"]),
    updatedAt: z.string().datetime(),
    answers: advisorAnswersSchema,
    softwareSelections: softwareSelectionsSchema(100),
    hardware: z
      .object({
        gpuVendor: z.enum(["unknown", "nvidia", "amd", "intel"]),
        evidence: hardwareEvidenceSchema,
        notes: z.string().max(1000),
        snapshot: storedHardwareSnapshotSchema.nullable()
      })
      .strict(),
    liveTests: liveTestsSchema,
    mediaProgress: mediaProgressSchema,
    selectedDistroId: distroIdSchema.nullable(),
    comparisonDistroIds: z
      .array(distroIdSchema)
      .max(3)
      .refine((ids) => new Set(ids).size === ids.length),
    dataMigration: dataMigrationSchema
  })
  .strict();

export const MAX_PASSPORT_BYTES = 256 * 1024;
const MAX_DEPTH = 12;

function valueDepth(value: unknown, depth = 0): number {
  if (depth > MAX_DEPTH) return depth;
  if (Array.isArray(value)) {
    return value.reduce((maximum, child) => Math.max(maximum, valueDepth(child, depth + 1)), depth);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).reduce((maximum, child) => Math.max(maximum, valueDepth(child, depth + 1)), depth);
  }
  return depth;
}

function migrateV1(value: z.infer<typeof migrationPassportV1Schema>): MigrationPassport {
  const migrated = createDefaultPassport();
  const stateMap: Record<typeof value.hardware.overall, HardwareEvidenceState> = {
    verified: "known_fact",
    probably_supported: "user_reported",
    unknown: "unknown",
    known_issue: "known_issue",
    proprietary_driver_required: "user_reported"
  };
  const hardware = createDefaultHardware(value.hardware.gpuVendor);
  hardware.notes = value.hardware.notes;
  hardware.evidence.graphics = {
    state: stateMap[value.hardware.overall],
    required: true,
    details:
      value.hardware.overall === "unknown"
        ? ""
        : `Imported from Passport v1 overall state: ${value.hardware.overall}`
  };

  return {
    ...migrated,
    locale: value.locale,
    updatedAt: value.updatedAt,
    answers: value.answers,
    softwareSelections: value.softwareSelections,
    hardware,
    liveTests: value.liveTests,
    mediaProgress: value.mediaProgress,
    selectedDistroId: value.selectedDistroId,
    comparisonDistroIds: value.selectedDistroId ? [value.selectedDistroId] : [],
    dataMigration: {}
  };
}

function migrateV2(value: z.infer<typeof migrationPassportV2Schema>): MigrationPassport {
  return {
    schemaVersion: 3,
    product: value.product,
    locale: value.locale,
    updatedAt: value.updatedAt,
    answers: value.answers,
    softwareSelections: value.softwareSelections,
    hardware: {
      gpuVendor: value.hardware.gpuVendor,
      evidence: value.hardware.evidence,
      notes: value.hardware.notes,
      snapshot: null
    },
    liveTests: value.liveTests,
    mediaProgress: value.mediaProgress,
    selectedDistroId: value.selectedDistroId,
    comparisonDistroIds: value.comparisonDistroIds,
    dataMigration: value.dataMigration
  };
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

  const version =
    value !== null && typeof value === "object" && "schemaVersion" in value
      ? (value as { schemaVersion?: unknown }).schemaVersion
      : undefined;

  if (version === 1) {
    const parsedV1 = migrationPassportV1Schema.safeParse(value);
    if (!parsedV1.success) throw new Error("passport_schema_invalid");
    return migrateV1(parsedV1.data);
  }

  if (version === 2) {
    const parsedV2 = migrationPassportV2Schema.safeParse(value);
    if (!parsedV2.success) throw new Error("passport_schema_invalid");
    return migrateV2(parsedV2.data);
  }

  const parsed = migrationPassportSchema.safeParse(value);
  if (!parsed.success) throw new Error("passport_schema_invalid");
  return parsed.data;
}

export function serializePassport(passport: MigrationPassport): string {
  return JSON.stringify(migrationPassportSchema.parse(passport), null, 2);
}

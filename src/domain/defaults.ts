import type {
  AdvisorAnswers,
  DataMigrationSelections,
  HardwareClassId,
  HardwareEvidenceMap,
  HardwareProfile,
  LiveTestResults,
  MediaProgress,
  MigrationPassport
} from "./types";

export const DEFAULT_ANSWERS: AdvisorAnswers = {
  currentWindows: "windows11",
  deviceType: "desktop",
  experience: "none",
  terminalComfort: "avoid",
  troubleshooting: "guided",
  maintenance: "minimal",
  freshness: "stable",
  rollingTolerance: "no",
  desktopPreference: "windows_like",
  windowsLikeUi: "important",
  gaming: "casual",
  gameLaunchers: ["steam"],
  office: "basic",
  development: "none",
  creative: "none",
  mediaProduction: "none",
  professionalDependencies: "none",
  gpuVendor: "unknown",
  secureBoot: "preferred",
  proprietaryTolerance: "accept_if_needed",
  systemInterest: "use_it",
  migrationMode: "test"
};

export const DEFAULT_LIVE_TESTS: LiveTestResults = {
  wifi: "not_tested",
  ethernet: "not_tested",
  graphics: "not_tested",
  audio: "not_tested",
  bluetooth: "not_tested",
  suspend: "not_tested",
  external_monitor: "not_tested",
  webcam: "not_tested",
  microphone: "not_tested",
  printer: "not_tested"
};

export const DEFAULT_MEDIA_PROGRESS: MediaProgress = {
  download: false,
  verify: false,
  write: false,
  boot: false,
  test: false,
  return: false
};

export const HARDWARE_CLASS_IDS: HardwareClassId[] = [
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
  "special_usb"
];

export const DEFAULT_DATA_MIGRATION: DataMigrationSelections = {};

function createDefaultEvidence(): HardwareEvidenceMap {
  return Object.fromEntries(
    HARDWARE_CLASS_IDS.map((id) => [
      id,
      { state: "unknown", required: id === "graphics", details: "" }
    ])
  ) as HardwareEvidenceMap;
}

export function createDefaultHardware(
  gpuVendor: AdvisorAnswers["gpuVendor"] = "unknown"
): HardwareProfile {
  return {
    source: "manual",
    gpuVendor,
    scannerStatus: "deferred",
    evidence: createDefaultEvidence(),
    notes: ""
  };
}

export function createDefaultPassport(): MigrationPassport {
  return {
    schemaVersion: 2,
    product: "linux-migration-companion",
    locale: "en",
    updatedAt: new Date().toISOString(),
    answers: {
      ...DEFAULT_ANSWERS,
      gameLaunchers: [...DEFAULT_ANSWERS.gameLaunchers]
    },
    softwareSelections: {},
    hardware: createDefaultHardware(),
    liveTests: { ...DEFAULT_LIVE_TESTS },
    mediaProgress: { ...DEFAULT_MEDIA_PROGRESS },
    selectedDistroId: null,
    comparisonDistroIds: [],
    dataMigration: { ...DEFAULT_DATA_MIGRATION }
  };
}

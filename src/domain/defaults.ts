import type {
  AdvisorAnswers,
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

export function createDefaultHardware(
  gpuVendor: AdvisorAnswers["gpuVendor"] = "unknown"
): HardwareProfile {
  return {
    source: "manual",
    gpuVendor,
    overall: gpuVendor === "nvidia" ? "proprietary_driver_required" : "unknown",
    scannerStatus: "deferred",
    notes: ""
  };
}

export function createDefaultPassport(): MigrationPassport {
  return {
    schemaVersion: 1,
    product: "linux-migration-companion",
    locale: "en",
    updatedAt: new Date().toISOString(),
    answers: DEFAULT_ANSWERS,
    softwareSelections: {},
    hardware: createDefaultHardware(),
    liveTests: DEFAULT_LIVE_TESTS,
    mediaProgress: DEFAULT_MEDIA_PROGRESS,
    selectedDistroId: null
  };
}

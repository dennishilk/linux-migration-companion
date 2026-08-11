export type Locale = "en" | "de";

export interface LocalizedText {
  en: string;
  de: string;
}

export type ExperienceLevel =
  | "none"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type ComfortLevel = "avoid" | "guided" | "comfortable" | "enthusiast";
export type MaintenanceLevel = "minimal" | "regular" | "active" | "hobby";
export type RollingTolerance = "no" | "maybe" | "yes";
export type FreshnessPreference = "stable" | "balanced" | "newest";
export type DesktopPreference =
  | "windows_like"
  | "kde"
  | "gnome"
  | "no_preference"
  | "build_my_own";
export type GamingImportance = "none" | "casual" | "important" | "critical";
export type GpuVendor = "unknown" | "nvidia" | "amd" | "intel";
export type SystemInterest =
  | "use_it"
  | "customize"
  | "declarative"
  | "manual_build"
  | "compile_control";
export type MigrationMode = "test" | "dual_boot" | "replace";

export type GameLauncher =
  | "steam"
  | "battlenet"
  | "epic"
  | "xbox"
  | "ea"
  | "ubisoft"
  | "riot"
  | "vr";

export interface AdvisorAnswers {
  currentWindows: "windows10" | "windows11" | "other";
  deviceType: "desktop" | "laptop";
  experience: ExperienceLevel;
  terminalComfort: ComfortLevel;
  troubleshooting: ComfortLevel;
  maintenance: MaintenanceLevel;
  freshness: FreshnessPreference;
  rollingTolerance: RollingTolerance;
  desktopPreference: DesktopPreference;
  windowsLikeUi: "important" | "nice" | "irrelevant";
  gaming: GamingImportance;
  gameLaunchers: GameLauncher[];
  office: "none" | "basic" | "complex";
  development: "none" | "web" | "cross_platform" | "microsoft_stack";
  creative: "none" | "hobby" | "professional";
  mediaProduction: "none" | "hobby" | "professional";
  professionalDependencies: "none" | "replaceable" | "essential";
  gpuVendor: GpuVendor;
  secureBoot: "required" | "preferred" | "irrelevant";
  proprietaryTolerance: "avoid" | "accept_if_needed" | "comfortable";
  systemInterest: SystemInterest;
  migrationMode: MigrationMode;
}

export type RecommendationTier =
  | "strong"
  | "possible"
  | "exploratory"
  | "not_recommended";

export interface DistroProfile {
  id: string;
  name: string;
  edition?: string;
  category: "mainstream" | "gaming" | "advanced" | "expert";
  supportDepth: "guided" | "reference" | "experimental";
  summary: LocalizedText;
  maintenance: LocalizedText;
  desktop: LocalizedText;
  releaseModel: "lts" | "stable" | "rapid" | "rolling";
  officialHome: string;
  downloadUrl: string;
  verifyUrl: string;
  installUrl: string;
  mediaTool: "rufus_or_etcher" | "fedora_media_writer" | "official_guidance";
  reviewedAt: string;
}

export interface DistroRecommendation {
  distro: DistroProfile;
  score: number;
  tier: RecommendationTier;
  reasons: LocalizedText[];
  tradeoffs: LocalizedText[];
  causedBy: LocalizedText[];
  changeFactors: LocalizedText[];
}

export type SoftwareRoute =
  | "native"
  | "web_option"
  | "compatibility_layer"
  | "alternative_workflow"
  | "partial_replacement"
  | "no_real_equivalent"
  | "manual_verification_required";

export type MigrationRisk = "low" | "medium" | "high" | "blocker";

export interface SoftwareRecord {
  id: string;
  name: string;
  category:
    | "office"
    | "creative"
    | "development"
    | "gaming"
    | "communication"
    | "media"
    | "professional"
    | "hardware"
    | "cloud"
    | "security";
  routes: SoftwareRoute[];
  baseRisk: Exclude<MigrationRisk, "blocker">;
  blockerWhenEssential?: boolean;
  scope: "application" | "workflow";
  freshness: "stable" | "volatile";
  summary: LocalizedText;
  verify: LocalizedText;
  sourceLabel: string;
  sourceUrl: string;
  reviewedAt: string;
}

export type SoftwarePriority = "important" | "essential";
export type SoftwareSelections = Record<string, SoftwarePriority>;

export interface SoftwareAssessmentItem {
  record: SoftwareRecord;
  priority: SoftwarePriority;
  risk: MigrationRisk;
}

export interface SoftwareAssessment {
  items: SoftwareAssessmentItem[];
  blockers: SoftwareAssessmentItem[];
  tradeoffs: SoftwareAssessmentItem[];
  overall: "ready" | "review" | "blocked";
}

export type HardwareEvidenceState =
  | "unknown"
  | "known_fact"
  | "user_reported"
  | "live_verified"
  | "failed_test"
  | "known_issue"
  | "not_applicable";

export type HardwareClassId =
  | "graphics"
  | "hybrid_graphics"
  | "wifi"
  | "bluetooth"
  | "ethernet"
  | "audio"
  | "usb_audio"
  | "webcam"
  | "microphone"
  | "fingerprint"
  | "dock"
  | "external_monitors"
  | "hidpi"
  | "printer"
  | "scanner"
  | "capture_device"
  | "game_controller"
  | "racing_wheel"
  | "special_usb";

export interface HardwareEvidence {
  state: HardwareEvidenceState;
  required: boolean;
  details: string;
}

export type HardwareEvidenceMap = Record<HardwareClassId, HardwareEvidence>;

export interface HardwareProfile {
  source: "manual";
  gpuVendor: GpuVendor;
  scannerStatus: "deferred";
  evidence: HardwareEvidenceMap;
  notes: string;
}

export type LiveTestId =
  | "wifi"
  | "ethernet"
  | "graphics"
  | "audio"
  | "bluetooth"
  | "suspend"
  | "external_monitor"
  | "webcam"
  | "microphone"
  | "printer";

export type LiveTestStatus = "not_tested" | "works" | "issue" | "not_applicable";
export type LiveTestResults = Record<LiveTestId, LiveTestStatus>;

export type LiveReadiness = "ready" | "blocked" | "incomplete";

export type MediaStepId =
  | "download"
  | "verify"
  | "write"
  | "boot"
  | "test"
  | "return";
export type MediaProgress = Record<MediaStepId, boolean>;

export interface FirstBootStep {
  id: string;
  title: LocalizedText;
  what: LocalizedText;
  why: LocalizedText;
  risk: LocalizedText;
  verify: LocalizedText;
  backOut: LocalizedText;
}

export type ReadinessState =
  | "ready"
  | "ready_with_checks"
  | "live_test_required"
  | "windows_should_be_retained"
  | "blocked"
  | "insufficient_evidence";

export type MigrationStrategy =
  | "linux_primary"
  | "test_first"
  | "dual_boot"
  | "keep_windows_temporarily"
  | "keep_windows_for_workflows"
  | "migration_blocked";

export interface ReadinessAssessment {
  state: ReadinessState;
  strategy: MigrationStrategy;
  reasons: LocalizedText[];
  checks: LocalizedText[];
  blockers: LocalizedText[];
}

export type DataMigrationId =
  | "documents"
  | "photos"
  | "videos"
  | "browser_profile"
  | "password_manager"
  | "email"
  | "outlook_archives"
  | "cloud_storage"
  | "onedrive"
  | "google_drive"
  | "dropbox"
  | "steam_libraries"
  | "game_saves"
  | "ssh_keys"
  | "git_repositories"
  | "development_projects"
  | "local_databases"
  | "application_data"
  | "backups";

export type DataMigrationMethod =
  | "copy"
  | "sync"
  | "export_import"
  | "reconfigure"
  | "manual_check"
  | "do_not_assume";

export interface DataMigrationSelection {
  importance: "important" | "essential";
  method: DataMigrationMethod;
  notes: string;
}

export type DataMigrationSelections = Partial<
  Record<DataMigrationId, DataMigrationSelection>
>;

export interface DataMigrationPlanItem {
  id: DataMigrationId;
  title: LocalizedText;
  importance: "important" | "essential";
  method: DataMigrationMethod;
  action: LocalizedText;
  warning: LocalizedText;
  notes: string;
}

export interface DataMigrationAssessment {
  items: DataMigrationPlanItem[];
  hasEssentialItems: boolean;
  needsManualChecks: boolean;
  evidenceComplete: boolean;
}

export interface MigrationPassport {
  schemaVersion: 2;
  product: "linux-migration-companion";
  locale: Locale;
  updatedAt: string;
  answers: AdvisorAnswers;
  softwareSelections: SoftwareSelections;
  hardware: HardwareProfile;
  liveTests: LiveTestResults;
  mediaProgress: MediaProgress;
  selectedDistroId: string | null;
  comparisonDistroIds: string[];
  dataMigration: DataMigrationSelections;
}

export type AppSection =
  | "advisor"
  | "compare"
  | "software"
  | "hardware"
  | "live"
  | "readiness"
  | "data"
  | "media"
  | "passport"
  | "first_boot";

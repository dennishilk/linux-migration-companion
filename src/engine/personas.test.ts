import { describe, expect, it } from "vitest";
import { HARDWARE_CLASS_IDS } from "../domain/defaults";
import type {
  HardwareClassId,
  HardwareEvidenceState,
  MigrationPassport,
  StoredHardwareSnapshot
} from "../domain/types";
import { applyHardwareSnapshot } from "../hardware/integration";
import { parseHardwareSnapshotText } from "../hardware/snapshotSchema";
import { parsePassportText } from "../passport/schema";
import { makeLinuxSnapshot, makeWindowsSnapshot } from "../test/hardwareFixtures";
import { makeAnswers, makePassport } from "../test/fixtures";
import { assessSoftware } from "./assess";
import { assessMigrationReadiness } from "./readiness";
import { buildAdvisorWarnings, recommendDistros } from "./recommend";

function recommendationFor(
  answers: ReturnType<typeof makeAnswers>,
  distroId: string
) {
  const result = recommendDistros(answers).find(
    (item) => item.distro.id === distroId
  );
  if (!result) throw new Error(`Missing distro ${distroId}`);
  return result;
}

function passportWithHardwareCheck(
  id: HardwareClassId,
  state: HardwareEvidenceState = "unknown"
): MigrationPassport {
  const passport = makePassport();
  passport.softwareSelections = { firefox: "important" };
  passport.liveTests = Object.fromEntries(
    Object.keys(passport.liveTests).map((testId) => [testId, "not_applicable"])
  ) as MigrationPassport["liveTests"];

  for (const hardwareId of HARDWARE_CLASS_IDS) {
    passport.hardware.evidence[hardwareId] = {
      state: "not_applicable",
      required: false,
      details: ""
    };
  }
  passport.hardware.evidence[id] = {
    state,
    required: true,
    details: state === "user_reported" ? "Reported, not verified here" : ""
  };
  return passport;
}

function stored(
  snapshot: ReturnType<typeof makeWindowsSnapshot> | ReturnType<typeof makeLinuxSnapshot>
): StoredHardwareSnapshot {
  return {
    acquisition: "file_import",
    acquiredAt: "2026-08-11T12:01:00.000Z",
    snapshot
  };
}

const personas: Array<{ name: string; verify: () => void }> = [
  {
    name: "01 beginner gets approachable mainstream choices",
    verify: () => {
      const results = recommendDistros(makeAnswers());
      expect(results.slice(0, 3).map((item) => item.distro.id)).toEqual([
        "linux-mint-cinnamon",
        "zorin-os",
        "ubuntu-lts"
      ]);
    }
  },
  {
    name: "02 Office-heavy family is not pushed to a specialist distro",
    verify: () => {
      const results = recommendDistros(
        makeAnswers({ office: "complex", gaming: "none", gameLaunchers: [] })
      );
      expect(results.slice(0, 3).every((item) => item.distro.category === "mainstream")).toBe(true);
    }
  },
  {
    name: "03 Adobe professional receives a hard workflow blocker",
    verify: () => {
      const passport = makePassport();
      passport.softwareSelections = { photoshop: "essential" };
      const result = assessMigrationReadiness(
        passport,
        assessSoftware(passport.softwareSelections)
      );
      expect(result.state).toBe("blocked");
      expect(result.strategy).toBe("keep_windows_for_workflows");
    }
  },
  {
    name: "04 casual Steam gamer remains on mainstream recommendations",
    verify: () => {
      const results = recommendDistros(
        makeAnswers({ gaming: "casual", gameLaunchers: ["steam"] })
      );
      expect(results[0].distro.category).toBe("mainstream");
      expect(recommendationFor(makeAnswers(), "cachyos").tier).toBe("not_recommended");
    }
  },
  {
    name: "05 competitive anti-cheat gamer gets a blocker warning",
    verify: () => {
      const warnings = buildAdvisorWarnings(
        makeAnswers({ gaming: "critical", gameLaunchers: ["riot"] })
      );
      expect(warnings.some((warning) => warning.severity === "blocker")).toBe(true);
    }
  },
  {
    name: "06 NVIDIA plus Secure Boot keeps verification explicit",
    verify: () => {
      const answers = makeAnswers({ gpuVendor: "nvidia", secureBoot: "required" });
      const warnings = buildAdvisorWarnings(answers);
      const top = recommendDistros(answers)[0];
      expect(top.reasons.some((reason) => reason.en.includes("NVIDIA"))).toBe(true);
      expect(warnings.some((warning) => warning.title.en.includes("Secure Boot"))).toBe(true);
    }
  },
  {
    name: "07 AMD gamer is not given a fabricated compatibility result",
    verify: () => {
      const results = recommendDistros(
        makeAnswers({ gpuVendor: "amd", gaming: "important" })
      );
      expect(JSON.stringify(results)).not.toMatch(/\d+%/);
      expect(results[0].distro.category).toBe("mainstream");
    }
  },
  {
    name: "08 laptop with unknown Wi-Fi requires a live test",
    verify: () => {
      const passport = passportWithHardwareCheck("wifi");
      passport.answers.deviceType = "laptop";
      expect(
        assessMigrationReadiness(passport, assessSoftware(passport.softwareSelections)).state
      ).toBe("live_test_required");
    }
  },
  {
    name: "09 hybrid-GPU user report is not promoted to verification",
    verify: () => {
      const passport = passportWithHardwareCheck("hybrid_graphics", "user_reported");
      expect(
        assessMigrationReadiness(passport, assessSoftware(passport.softwareSelections)).state
      ).toBe("live_test_required");
    }
  },
  {
    name: "10 experienced developer can surface Fedora",
    verify: () => {
      const results = recommendDistros(
        makeAnswers({
          experience: "advanced",
          terminalComfort: "comfortable",
          troubleshooting: "comfortable",
          maintenance: "regular",
          freshness: "newest",
          development: "cross_platform",
          gaming: "none",
          gameLaunchers: []
        })
      );
      expect(results.slice(0, 3).map((item) => item.distro.id)).toContain("fedora-kde");
    }
  },
  {
    name: "11 essential CAD workflow blocks replacement",
    verify: () => {
      const passport = makePassport();
      passport.softwareSelections = { "fusion-360": "essential" };
      const result = assessMigrationReadiness(
        passport,
        assessSoftware(passport.softwareSelections)
      );
      expect(result.state).toBe("blocked");
      expect(result.blockers[0].en).toContain("Autodesk Fusion");
    }
  },
  {
    name: "12 privacy-focused user sees a proprietary-driver conflict",
    verify: () => {
      const warnings = buildAdvisorWarnings(
        makeAnswers({ gpuVendor: "nvidia", proprietaryTolerance: "avoid" })
      );
      expect(warnings.some((warning) => warning.title.en.includes("NVIDIA"))).toBe(true);
    }
  },
  {
    name: "13 experienced current-software user gets broader valid options",
    verify: () => {
      const results = recommendDistros(
        makeAnswers({
          experience: "advanced",
          terminalComfort: "comfortable",
          troubleshooting: "comfortable",
          maintenance: "active",
          freshness: "newest",
          rollingTolerance: "yes"
        })
      );
      expect(results.some((item) => item.distro.id === "opensuse-tumbleweed-kde" && item.tier !== "not_recommended")).toBe(true);
    }
  },
  {
    name: "14 Arch-curious beginner is gated",
    verify: () => {
      const answers = makeAnswers({ systemInterest: "manual_build" });
      expect(recommendationFor(answers, "arch-linux").tier).toBe("not_recommended");
    }
  },
  {
    name: "15 declarative advanced user can explicitly unlock NixOS",
    verify: () => {
      const answers = makeAnswers({
        experience: "advanced",
        terminalComfort: "comfortable",
        troubleshooting: "comfortable",
        maintenance: "active",
        systemInterest: "declarative"
      });
      expect(recommendationFor(answers, "nixos").tier).toBe("strong");
    }
  },
  {
    name: "16 Gentoo requires the complete expert persona",
    verify: () => {
      const answers = makeAnswers({
        experience: "expert",
        terminalComfort: "enthusiast",
        troubleshooting: "enthusiast",
        maintenance: "hobby",
        freshness: "newest",
        rollingTolerance: "yes",
        desktopPreference: "build_my_own",
        systemInterest: "compile_control"
      });
      expect(recommendationFor(answers, "gentoo").tier).toBe("strong");
    }
  },
  {
    name: "17 printer-dependent user cannot pass an unknown printer",
    verify: () => {
      const passport = passportWithHardwareCheck("printer");
      expect(
        assessMigrationReadiness(passport, assessSoftware(passport.softwareSelections)).state
      ).toBe("live_test_required");
    }
  },
  {
    name: "18 accessibility device report remains a required live check",
    verify: () => {
      const passport = passportWithHardwareCheck("special_usb", "user_reported");
      const result = assessMigrationReadiness(
        passport,
        assessSoftware(passport.softwareSelections)
      );
      expect(result.state).toBe("live_test_required");
      expect(result.checks.some((item) => item.en.includes("not live-test verified"))).toBe(true);
    }
  },
  {
    name: "19 all-UNKNOWN profile stays insufficient evidence",
    verify: () => {
      const passport = makePassport();
      const result = assessMigrationReadiness(passport, assessSoftware({}));
      expect(result.state).toBe("insufficient_evidence");
      expect(result.strategy).toBe("test_first");
    }
  },
  {
    name: "20 contradictory imported profile is rejected",
    verify: () => {
      const passport = makePassport();
      passport.hardware.evidence.graphics = {
        state: "not_applicable",
        required: true,
        details: "contradictory"
      };
      expect(() => parsePassportText(JSON.stringify(passport))).toThrow(
        "passport_schema_invalid"
      );
    }
  },
  {
    name: "21 Windows 11 hybrid laptop remains detected, not verified",
    verify: () => {
      const passport = makePassport();
      passport.answers.deviceType = "laptop";
      passport.hardware = applyHardwareSnapshot(
        passport.hardware,
        stored(makeWindowsSnapshot())
      );
      expect(passport.hardware.evidence.hybrid_graphics.state).toBe("known_fact");
      expect(passport.hardware.evidence.graphics.state).not.toBe("live_verified");
      expect(passport.liveTests.graphics).toBe("not_tested");
    }
  },
  {
    name: "22 NVIDIA desktop with USB Wi-Fi gains facts but no requirement",
    verify: () => {
      const snapshot = makeWindowsSnapshot();
      snapshot.system.formFactor = "desktop";
      const wifi = snapshot.facts.find((fact) => fact.category === "wifi");
      if (!wifi) throw new Error("Missing fixture Wi-Fi");
      wifi.name = "USB 0bda:c811";
      wifi.bus = "usb";
      wifi.vendorId = "0bda";
      wifi.deviceId = "c811";
      const hardware = applyHardwareSnapshot(makePassport().hardware, stored(snapshot));
      expect(hardware.gpuVendor).toBe("nvidia");
      expect(hardware.evidence.wifi.state).toBe("known_fact");
      expect(hardware.evidence.wifi.required).toBe(false);
    }
  },
  {
    name: "23 detected Wi-Fi with a live problem blocks migration",
    verify: () => {
      const passport = passportWithHardwareCheck("wifi", "known_fact");
      passport.liveTests.wifi = "issue";
      passport.hardware.evidence.wifi.state = "failed_test";
      const result = assessMigrationReadiness(
        passport,
        assessSoftware(passport.softwareSelections)
      );
      expect(result.state).toBe("blocked");
      expect(result.strategy).toBe("migration_blocked");
    }
  },
  {
    name: "24 detected fingerprint reader remains untested",
    verify: () => {
      const passport = passportWithHardwareCheck("fingerprint", "known_fact");
      const result = assessMigrationReadiness(
        passport,
        assessSoftware(passport.softwareSelections)
      );
      expect(result.state).toBe("live_test_required");
      expect(passport.hardware.evidence.fingerprint.state).toBe("known_fact");
    }
  },
  {
    name: "25 multiple storage devices remain factual Passport data only",
    verify: () => {
      const snapshot = makeWindowsSnapshot();
      snapshot.facts.push({ category: "storage", name: "SATA SSD (476.9 GiB)" });
      const hardware = applyHardwareSnapshot(makePassport().hardware, stored(snapshot));
      expect(hardware.snapshot?.snapshot.facts.filter((fact) => fact.category === "storage")).toHaveLength(2);
      expect(Object.keys(hardware.evidence)).not.toContain("storage");
    }
  },
  {
    name: "26 current Linux host can evaluate another target without a support shortcut",
    verify: () => {
      const passport = makePassport();
      passport.hardware = applyHardwareSnapshot(
        passport.hardware,
        stored(makeLinuxSnapshot())
      );
      const result = assessMigrationReadiness(passport, assessSoftware({}));
      expect(passport.hardware.snapshot?.snapshot.system.osFamily).toBe("linux");
      expect(passport.hardware.evidence.graphics.state).toBe("known_fact");
      expect(result.state).toBe("live_test_required");
    }
  },
  {
    name: "27 manually modified valid snapshot remains an untrusted source claim",
    verify: () => {
      const snapshot = makeWindowsSnapshot();
      snapshot.facts[3].name = "User-edited adapter description";
      const parsed = parseHardwareSnapshotText(JSON.stringify(snapshot));
      const record = stored(parsed);
      const hardware = applyHardwareSnapshot(makePassport().hardware, record);
      expect(record.acquisition).toBe("file_import");
      expect(record.snapshot.source).toBe("windows_collector");
      expect(hardware.evidence.wifi.state).toBe("known_fact");
      expect(hardware.evidence.wifi.state).not.toBe("live_verified");
    }
  },
  {
    name: "28 unknown new device strings survive without widening category IDs",
    verify: () => {
      const snapshot = makeLinuxSnapshot();
      snapshot.facts[1].name = "Future Adapter Ω revision 2040";
      const parsed = parseHardwareSnapshotText(JSON.stringify(snapshot));
      expect(parsed.facts[1].name).toContain("Future Adapter Ω");
      expect(applyHardwareSnapshot(makePassport().hardware, stored(parsed)).evidence.wifi.state).toBe("known_fact");
    }
  },
  {
    name: "29 detected is never serialized as compatible or live verified",
    verify: () => {
      const passport = makePassport();
      passport.hardware = applyHardwareSnapshot(
        passport.hardware,
        stored(makeWindowsSnapshot())
      );
      expect(JSON.stringify(passport.hardware)).not.toMatch(/compatible/i);
      expect(Object.values(passport.hardware.evidence).some((item) => item.state === "live_verified")).toBe(false);
    }
  },
  {
    name: "30 missing important device identity remains UNKNOWN",
    verify: () => {
      const passport = makePassport();
      passport.hardware = applyHardwareSnapshot(
        passport.hardware,
        stored(makeWindowsSnapshot())
      );
      passport.hardware.evidence.printer.required = true;
      const result = assessMigrationReadiness(passport, assessSoftware({}));
      expect(passport.hardware.evidence.printer.state).toBe("unknown");
      expect(result.state).toBe("live_test_required");
    }
  }
];

describe("adversarial release-candidate personas", () => {
  it.each(personas)("$name", ({ verify }) => verify());
});

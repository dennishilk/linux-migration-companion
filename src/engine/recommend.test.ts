import { describe, expect, it } from "vitest";
import type { AdvisorAnswers } from "../domain/types";
import { buildAdvisorWarnings, recommendDistros } from "./recommend";
import { makeAnswers } from "../test/fixtures";

const find = (answers: AdvisorAnswers, id: string) => {
  const result = recommendDistros(answers).find((item) => item.distro.id === id);
  if (!result) throw new Error(`Missing distro ${id}`);
  return result;
};

describe("deterministic distro recommendations", () => {
  it("puts approachable mainstream choices first for the default migrant", () => {
    const results = recommendDistros(makeAnswers());
    expect(results.slice(0, 3).map((item) => item.distro.id)).toEqual([
      "linux-mint-cinnamon",
      "zorin-os",
      "kubuntu"
    ]);
    expect(results.slice(0, 4).map((item) => item.distro.id)).toContain("ubuntu-lts");
  });

  it("keeps beginner NVIDIA Steam users on mainstream choices", () => {
    const answers = makeAnswers({
      experience: "beginner",
      gpuVendor: "nvidia",
      gaming: "critical",
      maintenance: "minimal",
      troubleshooting: "guided",
      rollingTolerance: "no",
      gameLaunchers: ["steam"]
    });
    const results = recommendDistros(answers);
    expect(results[0].distro.id).toBe("linux-mint-cinnamon");
    expect(results.slice(0, 3).every((item) => item.distro.category === "mainstream")).toBe(true);
    expect(find(answers, "cachyos").tier).toBe("not_recommended");
    expect(["exploratory", "not_recommended"]).toContain(find(answers, "nobara").tier);
  });

  it("never treats gaming alone as the CachyOS gate", () => {
    const answers = makeAnswers({ gaming: "critical" });
    expect(find(answers, "cachyos").tier).toBe("not_recommended");
  });

  it("allows CachyOS to rise for an experienced AMD rolling-release gamer", () => {
    const answers = makeAnswers({
      experience: "advanced",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "active",
      freshness: "newest",
      rollingTolerance: "yes",
      desktopPreference: "kde",
      windowsLikeUi: "nice",
      gaming: "critical",
      gameLaunchers: ["steam"],
      office: "none",
      gpuVendor: "amd",
      secureBoot: "irrelevant",
      proprietaryTolerance: "comfortable",
      systemInterest: "customize"
    });
    expect(find(answers, "cachyos").tier).toBe("strong");
  });

  it("keeps a low-maintenance office family near Mint, Zorin, Kubuntu and Ubuntu", () => {
    const results = recommendDistros(
      makeAnswers({ gaming: "none", gameLaunchers: [], office: "complex" })
    );
    expect(results.slice(0, 3).map((item) => item.distro.id)).toEqual([
      "linux-mint-cinnamon",
      "zorin-os",
      "kubuntu"
    ]);
    expect(results.slice(0, 4).map((item) => item.distro.id)).toContain("ubuntu-lts");
  });

  it("lets Fedora participate for an experienced modern development workflow", () => {
    const answers = makeAnswers({
      experience: "advanced",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "regular",
      freshness: "newest",
      desktopPreference: "kde",
      development: "cross_platform",
      gaming: "none",
      gameLaunchers: [],
      systemInterest: "customize"
    });
    expect(recommendDistros(answers).slice(0, 3).map((item) => item.distro.id)).toContain("fedora-kde");
  });

  it("requires explicit declarative intent for NixOS", () => {
    expect(find(makeAnswers({ experience: "advanced" }), "nixos").tier).toBe("not_recommended");
    const explicit = makeAnswers({
      experience: "advanced",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "active",
      systemInterest: "declarative"
    });
    expect(find(explicit, "nixos").tier).toBe("strong");
  });

  it("makes Arch strong for explicit manual assembly while preserving the default gate", () => {
    const explicit = makeAnswers({
      experience: "advanced",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "active",
      freshness: "newest",
      rollingTolerance: "yes",
      systemInterest: "manual_build"
    });
    expect(find(explicit, "arch-linux").tier).toBe("strong");
    expect(find(makeAnswers({ experience: "advanced" }), "arch-linux").tier).toBe("not_recommended");
  });

  it("surfaces Arch as a trade-off for a fully capable user without a manual-build answer", () => {
    const answers = makeAnswers({
      experience: "advanced",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "active",
      freshness: "newest",
      rollingTolerance: "yes",
      desktopPreference: "no_preference",
      systemInterest: "customize",
      gaming: "none",
      gameLaunchers: []
    });
    const arch = find(answers, "arch-linux");
    expect(arch.tier).toBe("possible");
    expect(arch.tradeoffs.some((item) => item.en.includes("manual system assembly"))).toBe(true);
  });

  it("only unlocks Gentoo for the complete expert persona", () => {
    const exact = makeAnswers({
      experience: "expert",
      terminalComfort: "enthusiast",
      troubleshooting: "enthusiast",
      maintenance: "hobby",
      freshness: "newest",
      rollingTolerance: "yes",
      desktopPreference: "build_my_own",
      systemInterest: "compile_control"
    });
    expect(find(exact, "gentoo").tier).toBe("strong");
    expect(find({ ...exact, maintenance: "active" }, "gentoo").tier).toBe("not_recommended");
  });

  it("surfaces Void from advanced properties without a distro-specific intent gate", () => {
    const answers = makeAnswers({
      experience: "advanced",
      terminalComfort: "enthusiast",
      troubleshooting: "enthusiast",
      maintenance: "hobby",
      freshness: "newest",
      rollingTolerance: "yes",
      desktopPreference: "build_my_own",
      windowsLikeUi: "irrelevant",
      gaming: "none",
      gameLaunchers: [],
      systemInterest: "customize"
    });
    const result = find(answers, "void-linux");
    expect(["strong", "possible"]).toContain(result.tier);
    expect(result.reasons.some((item) => item.en.includes("realistic specialist option"))).toBe(true);
  });

  it("keeps an Arch-like advanced user ahead of Gentoo without compile-control intent", () => {
    const answers = makeAnswers({
      experience: "advanced",
      terminalComfort: "enthusiast",
      troubleshooting: "enthusiast",
      maintenance: "hobby",
      freshness: "newest",
      rollingTolerance: "yes",
      desktopPreference: "build_my_own",
      systemInterest: "manual_build",
      gaming: "none",
      gameLaunchers: []
    });
    expect(find(answers, "arch-linux").tier).toBe("strong");
    expect(find(answers, "gentoo").tier).toBe("not_recommended");
  });

  it("does not let expert status override an explicit rolling-release refusal", () => {
    const answers = makeAnswers({
      experience: "expert",
      terminalComfort: "enthusiast",
      troubleshooting: "enthusiast",
      maintenance: "hobby",
      freshness: "newest",
      rollingTolerance: "no",
      desktopPreference: "build_my_own",
      systemInterest: "manual_build"
    });
    for (const id of [
      "opensuse-tumbleweed-kde",
      "cachyos",
      "void-linux",
      "endeavouros",
      "arch-linux",
      "gentoo"
    ]) {
      expect(find(answers, id).tier, id).toBe("not_recommended");
    }
  });

  it("keeps a gaming beginner away from enthusiast rolling recommendations", () => {
    const answers = makeAnswers({
      experience: "beginner",
      terminalComfort: "avoid",
      troubleshooting: "guided",
      maintenance: "minimal",
      freshness: "newest",
      rollingTolerance: "no",
      desktopPreference: "kde",
      gaming: "critical",
      gpuVendor: "nvidia",
      systemInterest: "use_it"
    });
    const results = recommendDistros(answers);
    expect(results.slice(0, 4).every((item) => item.distro.category === "mainstream")).toBe(true);
    for (const id of ["cachyos", "void-linux", "endeavouros", "arch-linux", "gentoo"]) {
      expect(find(answers, id).tier, id).toBe("not_recommended");
    }
    expect(["exploratory", "not_recommended"]).toContain(find(answers, "bazzite").tier);
  });

  it("makes Bazzite meaningful when gaming and a managed image model align", () => {
    const answers = makeAnswers({
      experience: "intermediate",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "regular",
      freshness: "balanced",
      rollingTolerance: "maybe",
      desktopPreference: "kde",
      gaming: "critical",
      gameLaunchers: ["steam"],
      gpuVendor: "amd",
      systemInterest: "use_it"
    });
    const bazzite = find(answers, "bazzite");
    expect(["strong", "possible"]).toContain(bazzite.tier);
    expect(bazzite.reasons.some((item) => item.en.includes("image-based model"))).toBe(true);
    expect(bazzite.tradeoffs.some((item) => item.en.includes("Fedora Atomic"))).toBe(true);
  });

  it("makes Kubuntu competitive for a mainstream KDE migrant", () => {
    const answers = makeAnswers({
      experience: "beginner",
      terminalComfort: "avoid",
      troubleshooting: "guided",
      maintenance: "minimal",
      freshness: "stable",
      rollingTolerance: "no",
      desktopPreference: "kde",
      windowsLikeUi: "important",
      gaming: "none",
      gameLaunchers: [],
      systemInterest: "use_it"
    });
    const top = recommendDistros(answers).slice(0, 4);
    expect(top.map((item) => item.distro.id)).toContain("kubuntu");
    expect(top.every((item) => item.distro.category === "mainstream")).toBe(true);
  });

  it("keeps Pop!_OS mainstream while respecting its current Secure Boot conflict", () => {
    const answers = makeAnswers({
      experience: "intermediate",
      terminalComfort: "avoid",
      troubleshooting: "guided",
      maintenance: "regular",
      freshness: "stable",
      rollingTolerance: "no",
      desktopPreference: "no_preference",
      gaming: "none",
      gameLaunchers: [],
      development: "cross_platform",
      secureBoot: "irrelevant",
      systemInterest: "use_it"
    });
    expect(["strong", "possible"]).toContain(find(answers, "pop-os").tier);

    const conflict = find({ ...answers, secureBoot: "required" }, "pop-os");
    expect(conflict.tier).toBe("not_recommended");
    expect(conflict.tradeoffs.some((item) => item.en.includes("requires Secure Boot to be disabled"))).toBe(true);
    expect(conflict.tradeoffs.some((item) => item.de.includes("deaktiviertes Secure Boot"))).toBe(true);
  });

  it("ranks installer-assisted EndeavourOS above manual Arch when that property fits", () => {
    const answers = makeAnswers({
      experience: "advanced",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "active",
      freshness: "newest",
      rollingTolerance: "yes",
      desktopPreference: "kde",
      windowsLikeUi: "irrelevant",
      gaming: "none",
      gameLaunchers: [],
      systemInterest: "customize"
    });
    const results = recommendDistros(answers);
    expect(find(answers, "endeavouros").tier).toBe("strong");
    expect(results.findIndex((item) => item.distro.id === "endeavouros")).toBeLessThan(
      results.findIndex((item) => item.distro.id === "arch-linux")
    );
  });

  it("is stable for identical input", () => {
    const answers = makeAnswers({ gpuVendor: "amd", gaming: "important" });
    expect(recommendDistros(answers)).toEqual(recommendDistros(structuredClone(answers)));
  });

  it("lets every questionnaire answer affect a score, explanation or warning", () => {
    const base = makeAnswers();
    const alternatives: Partial<Record<keyof AdvisorAnswers, AdvisorAnswers[keyof AdvisorAnswers]>> = {
      currentWindows: "windows10",
      deviceType: "laptop",
      experience: "advanced",
      terminalComfort: "comfortable",
      troubleshooting: "comfortable",
      maintenance: "active",
      freshness: "newest",
      rollingTolerance: "yes",
      desktopPreference: "kde",
      windowsLikeUi: "irrelevant",
      gaming: "critical",
      gameLaunchers: ["xbox"],
      office: "complex",
      development: "microsoft_stack",
      creative: "professional",
      mediaProduction: "professional",
      professionalDependencies: "essential",
      gpuVendor: "nvidia",
      secureBoot: "required",
      proprietaryTolerance: "avoid",
      systemInterest: "declarative",
      migrationMode: "replace"
    };
    const signature = (answers: AdvisorAnswers) =>
      JSON.stringify({ recommendations: recommendDistros(answers), warnings: buildAdvisorWarnings(answers) });
    const baseSignature = signature(base);

    for (const [field, value] of Object.entries(alternatives)) {
      const contextualBase =
        field === "proprietaryTolerance"
          ? makeAnswers({ gpuVendor: "nvidia" })
          : base;
      const changed = { ...contextualBase, [field]: value } as AdvisorAnswers;
      expect(signature(changed), field).not.toBe(
        contextualBase === base ? baseSignature : signature(contextualBase)
      );
    }
  });
});

describe("advisor warnings", () => {
  it("flags current Windows 10 support context", () => {
    expect(buildAdvisorWarnings(makeAnswers({ currentWindows: "windows10" })).some((warning) => warning.title.en.includes("Windows 10"))).toBe(true);
  });

  it("marks Xbox or Vanguard as a potential blocker", () => {
    const warnings = buildAdvisorWarnings(makeAnswers({ gameLaunchers: ["xbox", "riot"] }));
    expect(warnings.some((warning) => warning.severity === "blocker" && warning.title.en.includes("gaming"))).toBe(true);
  });

  it("surfaces the NVIDIA proprietary-driver policy conflict", () => {
    const warnings = buildAdvisorWarnings(
      makeAnswers({ gpuVendor: "nvidia", proprietaryTolerance: "avoid" })
    );
    expect(warnings.some((warning) => warning.title.en.includes("NVIDIA"))).toBe(true);
  });

  it("requires a Secure Boot verification path", () => {
    const warnings = buildAdvisorWarnings(makeAnswers({ secureBoot: "required" }));
    expect(warnings.some((warning) => warning.title.en.includes("Secure Boot"))).toBe(true);
  });
});

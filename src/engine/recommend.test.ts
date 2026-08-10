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
      "ubuntu-lts"
    ]);
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

  it("keeps a low-maintenance office family near Mint, Zorin and Ubuntu", () => {
    const results = recommendDistros(
      makeAnswers({ gaming: "none", gameLaunchers: [], office: "complex" })
    );
    expect(results.slice(0, 3).map((item) => item.distro.id)).toEqual([
      "linux-mint-cinnamon",
      "zorin-os",
      "ubuntu-lts"
    ]);
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

  it("requires manual-build intent and advanced competence for Arch", () => {
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

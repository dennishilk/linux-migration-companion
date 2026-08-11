import { describe, expect, it } from "vitest";
import { createDefaultPassport, DEFAULT_LIVE_TESTS } from "../domain/defaults";
import { makeAnswers } from "../test/fixtures";
import { buildFirstBootPlan } from "./firstBoot";

describe("personalized first-boot plan", () => {
  it("always starts with reviewed updates and backup", () => {
    const plan = buildFirstBootPlan("linux-mint-cinnamon", makeAnswers(), {}, DEFAULT_LIVE_TESTS);
    expect(plan.slice(0, 2).map((step) => step.id)).toEqual(["updates", "backup"]);
  });

  it("adds distro-specific NVIDIA guidance and a Secure Boot caution", () => {
    const plan = buildFirstBootPlan(
      "ubuntu-lts",
      makeAnswers({ gpuVendor: "nvidia", secureBoot: "required" }),
      {},
      DEFAULT_LIVE_TESTS
    );
    const step = plan.find((item) => item.id === "nvidia");
    expect(step?.what.en).toContain("Ubuntu");
    expect(step?.risk.en).toContain("Secure Boot");
  });

  it("adds Steam without claiming that individual games work", () => {
    const step = buildFirstBootPlan("linux-mint-cinnamon", makeAnswers(), {}, DEFAULT_LIVE_TESTS).find(
      (item) => item.id === "steam"
    );
    expect(step?.why.en).toContain("not evidence for every game");
  });

  it("adds selected native low-risk software", () => {
    const plan = buildFirstBootPlan(
      "fedora-kde",
      makeAnswers({ gameLaunchers: [] }),
      { discord: "essential" },
      DEFAULT_LIVE_TESTS
    );
    expect(plan.some((step) => step.id === "native-apps")).toBe(true);
  });

  it("keeps unresolved hardware visible", () => {
    const plan = buildFirstBootPlan("zorin-os", makeAnswers(), {}, DEFAULT_LIVE_TESTS);
    expect(plan.find((step) => step.id === "unresolved-hardware")?.risk.en).toContain("Removing Windows");
  });

  it("keeps generated NixOS hardware configuration outside the Companion", () => {
    const plan = buildFirstBootPlan("nixos", makeAnswers(), {}, DEFAULT_LIVE_TESTS);
    expect(plan.some((step) => step.id === "nixos-boundary")).toBe(true);
  });

  it("contains explanations but no executable shell commands", () => {
    const plan = buildFirstBootPlan(
      "arch-linux",
      makeAnswers({ gpuVendor: "nvidia" }),
      { firefox: "important" },
      DEFAULT_LIVE_TESTS
    );
    const allText = JSON.stringify(plan);
    expect(allText).not.toMatch(/\bsudo\b|\bapt(-get)?\b|\bdnf\b|\bpacman\s+-|\bcurl\s+/i);
  });

  it("puts a Windows-retention boundary before setup when an essential blocker exists", () => {
    const plan = buildFirstBootPlan(
      "linux-mint-cinnamon",
      makeAnswers(),
      { photoshop: "essential" },
      DEFAULT_LIVE_TESTS
    );
    expect(plan[0].id).toBe("retain-windows");
    expect(plan[0].what.en).toContain("Photoshop");
  });

  it("personalizes browser and office validation for an office user", () => {
    const ids = buildFirstBootPlan(
      "ubuntu-lts",
      makeAnswers({ office: "complex", gameLaunchers: [] }),
      { firefox: "important", "microsoft-365": "important" },
      DEFAULT_LIVE_TESTS
    ).map((item) => item.id);
    expect(ids).toContain("browser");
    expect(ids).toContain("office");
  });

  it("adds identity and cloud safeguards from selected workflows", () => {
    const ids = buildFirstBootPlan(
      "fedora-kde",
      makeAnswers({ gameLaunchers: [] }),
      { "password-manager": "important", "sharepoint-sync": "important" },
      DEFAULT_LIVE_TESTS
    ).map((item) => item.id);
    expect(ids).toContain("identity");
    expect(ids).toContain("cloud");
  });

  it("adds development and multimedia validation only from relevant evidence", () => {
    const ids = buildFirstBootPlan(
      "fedora-kde",
      makeAnswers({ development: "cross_platform", mediaProduction: "professional", gameLaunchers: [] }),
      {},
      DEFAULT_LIVE_TESTS
    ).map((item) => item.id);
    expect(ids).toContain("development");
    expect(ids).toContain("multimedia");
  });

  it("uses the complete Passport to include required hardware tasks", () => {
    const passport = createDefaultPassport();
    passport.hardware.evidence.bluetooth.required = true;
    passport.hardware.evidence.external_monitors.required = true;
    passport.hardware.evidence.printer.required = true;
    const ids = buildFirstBootPlan(passport).map((item) => item.id);
    expect(ids).toContain("bluetooth");
    expect(ids).toContain("displays");
    expect(ids).toContain("printer");
  });

  it("contains no command execution language in either locale", () => {
    const plan = buildFirstBootPlan(
      "nixos",
      makeAnswers({ gpuVendor: "nvidia", development: "cross_platform" }),
      { steam: "important", vscode: "important" },
      DEFAULT_LIVE_TESTS
    );
    expect(JSON.stringify(plan)).not.toMatch(/\bsudo\b|\bapt\b|\bdnf\b|\bpacman\b|\bnix-env\b|\bcurl\b/i);
  });

  it("gives every step a what, why, risk, verification and back-out path", () => {
    const plan = buildFirstBootPlan("ubuntu-lts", makeAnswers(), {}, DEFAULT_LIVE_TESTS);
    for (const item of plan) {
      expect(item.what.en.length).toBeGreaterThan(20);
      expect(item.why.en.length).toBeGreaterThan(20);
      expect(item.risk.en.length).toBeGreaterThan(20);
      expect(item.verify.en.length).toBeGreaterThan(20);
      expect(item.backOut.en.length).toBeGreaterThan(20);
    }
  });
});

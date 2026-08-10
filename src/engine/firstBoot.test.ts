import { describe, expect, it } from "vitest";
import { DEFAULT_LIVE_TESTS } from "../domain/defaults";
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
    expect(step?.summary.en).toContain("Ubuntu");
    expect(step?.caution?.en).toContain("Secure Boot");
  });

  it("adds Steam without claiming that individual games work", () => {
    const step = buildFirstBootPlan("linux-mint-cinnamon", makeAnswers(), {}, DEFAULT_LIVE_TESTS).find(
      (item) => item.id === "steam"
    );
    expect(step?.explanation.en).toContain("does not verify any game");
  });

  it("adds selected native low-risk software", () => {
    const plan = buildFirstBootPlan(
      "fedora-kde",
      makeAnswers({ gameLaunchers: [] }),
      { firefox: "essential" },
      DEFAULT_LIVE_TESTS
    );
    expect(plan.some((step) => step.id === "software-firefox")).toBe(true);
  });

  it("keeps unresolved hardware visible", () => {
    const plan = buildFirstBootPlan("zorin-os", makeAnswers(), {}, DEFAULT_LIVE_TESTS);
    expect(plan.find((step) => step.id === "unresolved-hardware")?.caution?.en).toContain("Do not remove Windows");
  });

  it("keeps generated NixOS hardware configuration outside Alpha", () => {
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
});

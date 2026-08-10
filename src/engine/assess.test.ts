import { describe, expect, it } from "vitest";
import { DEFAULT_LIVE_TESTS } from "../domain/defaults";
import { assessLiveReadiness, assessSoftware } from "./assess";

describe("software assessment", () => {
  it("returns ready when nothing is selected", () => {
    expect(assessSoftware({}).overall).toBe("ready");
  });

  it("keeps a native low-risk app ready", () => {
    const result = assessSoftware({ firefox: "essential" });
    expect(result.overall).toBe("ready");
    expect(result.items[0].risk).toBe("low");
  });

  it("turns an essential Photoshop workflow into a blocker", () => {
    const result = assessSoftware({ photoshop: "essential" });
    expect(result.overall).toBe("blocked");
    expect(result.blockers[0].record.id).toBe("photoshop");
  });

  it("keeps an important but nonessential Photoshop workflow as high risk", () => {
    const result = assessSoftware({ photoshop: "important" });
    expect(result.overall).toBe("review");
    expect(result.items[0].risk).toBe("high");
  });

  it("sorts blockers before lower risks", () => {
    const result = assessSoftware({ firefox: "important", "creative-cloud": "essential" });
    expect(result.items.map((item) => item.risk)).toEqual(["blocker", "low"]);
  });

  it("ignores unknown legacy identifiers defensively", () => {
    expect(assessSoftware({ "removed-item": "essential" }).items).toHaveLength(0);
  });
});

describe("live readiness", () => {
  it("is incomplete while a check is not tested", () => {
    expect(assessLiveReadiness(DEFAULT_LIVE_TESTS)).toBe("incomplete");
  });

  it("is blocked by any recorded issue", () => {
    expect(assessLiveReadiness({ ...DEFAULT_LIVE_TESTS, wifi: "issue" })).toBe("blocked");
  });

  it("is ready when every check is resolved or not applicable", () => {
    const resolved = Object.fromEntries(
      Object.keys(DEFAULT_LIVE_TESTS).map((key) => [key, key === "printer" ? "not_applicable" : "works"])
    ) as typeof DEFAULT_LIVE_TESTS;
    expect(assessLiveReadiness(resolved)).toBe("ready");
  });
});

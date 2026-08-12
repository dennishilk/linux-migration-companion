import { describe, expect, it } from "vitest";
import { hardwareSnapshotSchema } from "./snapshotSchema";
import { collectBrowserSnapshot } from "./browserSnapshot";

describe("limited browser hardware snapshot", () => {
  it("degrades safely when every optional browser API is unavailable", async () => {
    const snapshot = await collectBrowserSnapshot({}, new Date("2026-08-11T12:00:00Z"));
    expect(hardwareSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(snapshot.system).toMatchObject({
      osFamily: "unknown",
      architecture: "unknown",
      firmware: "unknown",
      secureBoot: "unavailable",
      virtualization: "unavailable"
    });
    expect(snapshot.browserCapabilities).toEqual({
      platform: "unavailable",
      hardwareConcurrency: "unavailable",
      deviceMemory: "unavailable",
      webgpu: "api_unavailable"
    });
    expect(snapshot.facts).toEqual([]);
  });

  it("records explicitly labelled privacy-reduced values without device identity", async () => {
    const snapshot = await collectBrowserSnapshot({
      userAgentData: { platform: "Windows" },
      hardwareConcurrency: 8,
      deviceMemory: 4
    });
    expect(snapshot.system).toMatchObject({
      osFamily: "windows",
      osLabel: "Windows",
      logicalProcessors: 8,
      memoryGiB: 4
    });
    expect(snapshot.browserCapabilities?.hardwareConcurrency).toBe(
      "reported_reduced"
    );
    expect(snapshot.browserCapabilities?.deviceMemory).toBe("reported_reduced");
    expect(snapshot.facts).toHaveLength(0);
  });

  it("feature-detects WebGPU but never reads adapter identity, features or limits", async () => {
    const marker = { name: "must-not-be-read", features: ["private"] };
    const snapshot = await collectBrowserSnapshot({
      gpu: { requestAdapter: async () => marker }
    });
    expect(snapshot.browserCapabilities?.webgpu).toBe("adapter_available");
    expect(JSON.stringify(snapshot)).not.toContain("must-not-be-read");
    expect(JSON.stringify(snapshot)).not.toContain("private");
  });

  it("treats absent, null and throwing WebGPU adapters as unavailable, not failure", async () => {
    const absent = await collectBrowserSnapshot({});
    const missing = await collectBrowserSnapshot({
      gpu: { requestAdapter: async () => null }
    });
    const blocked = await collectBrowserSnapshot({
      gpu: {
        requestAdapter: async () => {
          throw new Error("blocked");
        }
      }
    });
    expect(absent.browserCapabilities?.webgpu).toBe("api_unavailable");
    expect(missing.browserCapabilities?.webgpu).toBe("adapter_unavailable");
    expect(blocked.browserCapabilities?.webgpu).toBe("adapter_unavailable");
  });

  it("discards implausible numeric values instead of widening the schema", async () => {
    const snapshot = await collectBrowserSnapshot({
      hardwareConcurrency: 0,
      deviceMemory: Number.POSITIVE_INFINITY
    });
    expect(snapshot.system.logicalProcessors).toBeUndefined();
    expect(snapshot.system.memoryGiB).toBeUndefined();
  });
});

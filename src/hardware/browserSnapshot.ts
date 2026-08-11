import type { HardwareSnapshot } from "../domain/types";

interface BrowserNavigatorLike {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  userAgentData?: {
    platform?: string;
  };
  gpu?: {
    requestAdapter: () => Promise<unknown | null>;
  };
}

function platformFamily(platform: string | undefined): HardwareSnapshot["system"]["osFamily"] {
  if (!platform) return "unknown";
  if (/windows/i.test(platform)) return "windows";
  if (/linux|chrome os/i.test(platform)) return "linux";
  return "other";
}

function limitedNumber(
  value: number | undefined,
  minimum: number,
  maximum: number
): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : undefined;
}

export async function collectBrowserSnapshot(
  browser: BrowserNavigatorLike = navigator,
  now = new Date()
): Promise<HardwareSnapshot> {
  const platform = browser.userAgentData?.platform?.trim().slice(0, 120);
  const logicalProcessors = limitedNumber(
    browser.hardwareConcurrency,
    1,
    4096
  );
  const memoryGiB = limitedNumber(browser.deviceMemory, 0.25, 16384);

  let webgpu: NonNullable<
    HardwareSnapshot["browserCapabilities"]
  >["webgpu"] = "api_unavailable";
  if (browser.gpu) {
    try {
      webgpu = (await browser.gpu.requestAdapter())
        ? "adapter_available"
        : "adapter_unavailable";
    } catch {
      webgpu = "adapter_unavailable";
    }
  }

  return {
    schemaVersion: 1,
    product: "linux-migration-companion-hardware-snapshot",
    createdAt: now.toISOString(),
    source: "browser_reported",
    collector: {
      id: "browser-snapshot",
      version: "1.0.0"
    },
    system: {
      osFamily: platformFamily(platform),
      ...(platform ? { osLabel: platform } : {}),
      architecture: "unknown",
      formFactor: "unknown",
      ...(logicalProcessors ? { logicalProcessors } : {}),
      ...(memoryGiB ? { memoryGiB } : {}),
      firmware: "unknown",
      secureBoot: "unavailable",
      virtualization: "unavailable"
    },
    browserCapabilities: {
      platform: platform ? "reported" : "unavailable",
      hardwareConcurrency: logicalProcessors
        ? "reported_reduced"
        : "unavailable",
      deviceMemory: memoryGiB ? "reported_reduced" : "unavailable",
      webgpu
    },
    facts: []
  };
}

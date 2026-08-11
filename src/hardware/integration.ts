import { HARDWARE_CLASS_IDS } from "../domain/defaults";
import type {
  GpuVendor,
  HardwareClassId,
  HardwareProfile,
  HardwareSnapshotFact,
  StoredHardwareSnapshot
} from "../domain/types";

const hardwareClassIds = new Set<string>(HARDWARE_CLASS_IDS);

function detectedGpuVendor(facts: HardwareSnapshotFact[]): GpuVendor {
  const text = facts
    .filter((fact) => fact.category === "graphics")
    .map((fact) => `${fact.vendor ?? ""} ${fact.name}`.toLowerCase())
    .join(" ");
  if (text.includes("nvidia")) return "nvidia";
  if (text.includes("amd") || text.includes("advanced micro devices")) {
    return "amd";
  }
  if (text.includes("intel")) return "intel";
  return "unknown";
}

export function factsForHardwareClass(
  record: StoredHardwareSnapshot | null,
  id: HardwareClassId
): HardwareSnapshotFact[] {
  if (!record) return [];
  const direct = record.snapshot.facts.filter((fact) => fact.category === id);
  if (id === "hybrid_graphics") {
    const graphics = record.snapshot.facts.filter(
      (fact) => fact.category === "graphics"
    );
    return graphics.length > 1 ? graphics : direct;
  }
  return direct;
}

export function applyHardwareSnapshot(
  hardware: HardwareProfile,
  record: StoredHardwareSnapshot
): HardwareProfile {
  const evidence = Object.fromEntries(
    Object.entries(hardware.evidence).map(([id, item]) => [id, { ...item }])
  ) as HardwareProfile["evidence"];

  // A replaced snapshot must not leave behind an unlabelled detected state.
  // Preserve stronger/manual evidence and any item with manual details.
  if (hardware.snapshot) {
    for (const id of HARDWARE_CLASS_IDS) {
      if (
        evidence[id].state === "known_fact" &&
        evidence[id].details.trim() === "" &&
        factsForHardwareClass(hardware.snapshot, id).length > 0
      ) {
        evidence[id] = { ...evidence[id], state: "unknown" };
      }
    }
    if (
      evidence.external_monitors.state === "known_fact" &&
      evidence.external_monitors.details.trim() === "" &&
      (hardware.snapshot.snapshot.system.connectedDisplays ?? 0) > 1
    ) {
      evidence.external_monitors = {
        ...evidence.external_monitors,
        state: "unknown"
      };
    }
  }

  const detectedClasses = new Set<HardwareClassId>();
  for (const fact of record.snapshot.facts) {
    if (hardwareClassIds.has(fact.category)) {
      detectedClasses.add(fact.category as HardwareClassId);
    }
  }

  const graphicsCount = record.snapshot.facts.filter(
    (fact) => fact.category === "graphics"
  ).length;
  if (graphicsCount > 1) detectedClasses.add("hybrid_graphics");
  if ((record.snapshot.system.connectedDisplays ?? 0) > 1) {
    detectedClasses.add("external_monitors");
  }

  for (const id of detectedClasses) {
    if (evidence[id].state === "unknown") {
      evidence[id] = { ...evidence[id], state: "known_fact" };
    }
  }

  const inferredGpu = detectedGpuVendor(record.snapshot.facts);
  return {
    ...hardware,
    gpuVendor:
      hardware.gpuVendor === "unknown" ? inferredGpu : hardware.gpuVendor,
    evidence,
    snapshot: record
  };
}

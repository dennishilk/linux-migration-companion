import type { HardwareSnapshot } from "../domain/types";

export function makeWindowsSnapshot(): HardwareSnapshot {
  return {
    schemaVersion: 1,
    product: "linux-migration-companion-hardware-snapshot",
    createdAt: "2026-08-11T12:00:00.000Z",
    source: "windows_collector",
    collector: { id: "windows-powershell", version: "1.0.0" },
    system: {
      osFamily: "windows",
      osLabel: "Microsoft Windows 11 Pro",
      architecture: "x86_64",
      formFactor: "laptop",
      logicalProcessors: 16,
      memoryGiB: 32,
      firmware: "uefi",
      secureBoot: "enabled",
      virtualization: "enabled",
      connectedDisplays: 2
    },
    facts: [
      {
        category: "cpu",
        name: "Intel Core processor",
        vendor: "GenuineIntel"
      },
      {
        category: "graphics",
        name: "Intel integrated graphics",
        vendor: "Intel Corporation"
      },
      {
        category: "graphics",
        name: "NVIDIA GeForce graphics",
        vendor: "NVIDIA"
      },
      {
        category: "wifi",
        name: "Intel Wi-Fi adapter",
        vendor: "Intel Corporation"
      },
      {
        category: "ethernet",
        name: "USB Ethernet adapter"
      },
      {
        category: "fingerprint",
        name: "Fingerprint reader"
      },
      {
        category: "storage",
        name: "NVMe storage (953.9 GiB)"
      }
    ]
  };
}

export function makeLinuxSnapshot(): HardwareSnapshot {
  return {
    schemaVersion: 1,
    product: "linux-migration-companion-hardware-snapshot",
    createdAt: "2026-08-11T12:00:00.000Z",
    source: "linux_collector",
    collector: { id: "linux-python", version: "1.0.0" },
    system: {
      osFamily: "linux",
      architecture: "x86_64",
      formFactor: "desktop",
      firmware: "unknown",
      secureBoot: "unavailable",
      virtualization: "supported"
    },
    facts: [
      {
        category: "graphics",
        name: "PCI 1002:73bf",
        bus: "pci",
        vendorId: "1002",
        deviceId: "73bf"
      },
      {
        category: "wifi",
        name: "PCI 8086:51f0",
        bus: "pci",
        vendorId: "8086",
        deviceId: "51f0"
      },
      {
        category: "special_usb",
        name: "USB 1050:0407",
        bus: "usb",
        vendorId: "1050",
        deviceId: "0407"
      }
    ]
  };
}

# Hardware Snapshot design and collector audit

Last reviewed: 2026-08-12

Hardware Snapshot is optional. The complete Companion remains usable through manual evidence. The feature has three separate routes:

1. **Manual:** the user records a fact or test outcome in one of the 19 existing hardware classes.
2. **Browser reported:** the browser exposes a few coarse capability values. It exposes no device facts.
3. **Snapshot detected:** a user independently runs one readable collector and imports its JSON output.

The evidence chain is deliberately one-way:

```text
MANUAL / BROWSER REPORTED / SNAPSHOT DETECTED
                       ↓
              deliberate LIVE TEST
                       ↓
                 LIVE VERIFIED
```

`DETECTED HARDWARE FACT != LINUX COMPATIBILITY != LIVE VERIFIED FUNCTIONALITY`. Import never changes a live-test result, never marks a class required, and never asserts that a vendor works on Linux. The claimed collector ID is provenance supplied by an untrusted file, not a signature or authenticity proof.

## Data contract and import boundary

Hardware Snapshot schema v1 is published at [`schemas/hardware-snapshot.schema.json`](../schemas/hardware-snapshot.schema.json) and enforced in [`src/hardware/snapshotSchema.ts`](../src/hardware/snapshotSchema.ts). A snapshot has a fixed product ID, version, timestamp, source/collector pair, bounded system facts, at most 64 bounded hardware facts, and—for browser snapshots only—four closed capability labels.

Closed source/collector pairs are `browser_reported` + `browser-snapshot`, `windows_collector` + `windows-dotnet` or the advanced `windows-powershell`, and `linux_collector` + `linux-python`. Supporting two Windows implementations changes provenance only; neither receives compatibility or live-test authority.

The browser rejects input over 128 KiB, depth 8, unknown versions, extra properties, unknown enums, duplicate facts, unpaired PCI/USB IDs, contradictory source/collector pairs, control characters, malformed surrogate sequences, and known private/prototype-pollution key names. React renders imported strings as text; no field becomes HTML, a URL, a path operation, or a command. A Passport containing a snapshot remains under the stricter existing 256 KiB/depth-12 Passport boundary.

Schema categories are closed to the 19 evidence classes plus `cpu`, `storage`, `usb_controller`, `input_device`, and `display`. A current snapshot is stored, not an unbounded history. A replacement clears only stale, detail-free `known_fact` states derived from the previous snapshot; manual details, required flags, issues, and live outcomes remain.

## Limited browser route

The browser route feature-detects and reads only:

| Browser API | Stored value | Deliberate limitation |
|---|---|---|
| [`NavigatorUAData.platform`](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/platform) | Short platform label and coarse OS family | Limited availability; no legacy user-agent parsing fallback |
| [`navigator.hardwareConcurrency`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency) | Logical-processor value | Labelled `reported_reduced`; browsers may report fewer than the machine has |
| [`navigator.deviceMemory`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory) | Coarse GiB value | Labelled `reported_reduced`; limited support and deliberately clamped for privacy |
| [`GPU.requestAdapter()`](https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter) | Adapter available/unavailable/API unavailable | No adapter name, renderer, features, limits, vendor, architecture, or complete-GPU inference |

No WebGL renderer extension, media-device enumeration, WebUSB, WebHID, Bluetooth, canvas/audio fingerprint, benchmark, permission prompt, or network call is used. Missing or blocked APIs are `unavailable`, never a failed hardware test.

## Windows 10/11 collector

The normal Windows path is [`LinuxMigrationCompanion-HardwareSnapshot.exe`](../public/collectors/windows/LinuxMigrationCompanion-HardwareSnapshot.exe), built from the complete C# source in [`collectors/windows-exe`](../collectors/windows-exe). It is a framework-dependent .NET Framework 4.8 WinForms executable: one small portable file, no installer, no PowerShell wrapper, no third-party package, no network client, no update channel, and an `asInvoker` manifest. Collection logic uses local `System.Management` WMI queries and documented Win32 APIs directly.

.NET Framework 4.8 is included with Windows 10 22H2, while Windows 11 includes 4.8 or 4.8.1. This avoids shipping an opaque self-contained runtime while requiring no developer tooling or package install on the target systems. The architectural, build, checksum and signing rationale is in [WINDOWS_COLLECTOR_RELEASE.md](WINDOWS_COLLECTOR_RELEASE.md).

| Provider/class | Selected fields | Purpose | Deliberately discarded |
|---|---|---|---|
| `Win32_OperatingSystem` | `Caption`, `OSArchitecture` | Coarse OS label and architecture | Version/install/user/system paths and every other property |
| `Win32_ComputerSystem` | `Model`, `Manufacturer`, `PCSystemType`, `TotalPhysicalMemory`, `HypervisorPresent` | Form factor, coarse VM classification, memory, active-hypervisor signal | Raw model/manufacturer are used only for VM classification and are not exported; `Name`, `UserName`, domain/workgroup, owner, SKU, roles and every other property are not read |
| `Win32_Processor` | `Name`, `Manufacturer`, `NumberOfLogicalProcessors`, `VMMonitorModeExtensions`, `VirtualizationFirmwareEnabled` | CPU fact/count and coarse virtualization state | Processor IDs, serial-like IDs and every other property |
| `Win32_VideoController` | `Name`, `AdapterCompatibility` | Display-adapter facts | PNP/device IDs, driver files/versions, video memory and every other property |
| `MSFT_NetAdapter` | `InterfaceDescription`, `NdisPhysicalMedium`, `HardwareInterface` | Physical Wi-Fi/Ethernet/Bluetooth classification | Interface alias/name, MAC/permanent address, IP configuration, connection state/profile and every other property |
| `Win32_NetworkAdapter` fallback | `Name`, `Manufacturer`, `AdapterTypeID`, `PhysicalAdapter` | Physical Wi-Fi/Ethernet classification where `MSFT_NetAdapter` is unavailable | MAC address, GUID, connection ID, PNP/device ID and every other property |
| `Win32_SoundDevice` | `Name`, `Manufacturer` | Audio-device fact | Device/PNP IDs, status and every other property |
| `Win32_DiskDrive` | `Model`, `InterfaceType`, `MediaType`, `Size` | Non-unique storage model/type/capacity | Serial number, signature, partitions, volumes, mount points, file names/content, PNP/device ID and every other property |
| `Win32_USBController` | `Name`, `Manufacturer` | USB-controller fact | Device/PNP IDs and every other property |
| filtered `Win32_PnPEntity` | `Name`, `Manufacturer`, `PNPClass`, `Service`; query limited to USB video or biometric class | Webcam/fingerprint facts | PNP/device IDs and all unrelated PnP devices/properties |
| `Win32_DesktopMonitor` | `Status` only | Approximate connected-display count | Monitor names, IDs, EDID, serials and every other property |
| Win32 `GetFirmwareType` | Firmware enum only | UEFI/legacy label where available | No firmware variables, identifiers or settings |

Windows Secure Boot is deliberately exported as `unavailable`; the collector does not elevate merely to inspect it. WMI errors, missing classes and denied fields degrade to missing facts or `unknown`, not a compatibility failure.

The normal flow is: download `.exe`, double-click, choose **Create hardware snapshot**, then import the JSON. A new timestamped file is written to the Windows Downloads known folder. If Downloads is unavailable, Desktop and then Documents are tried. `FileMode.CreateNew` and exclusive sharing prevent overwrite, collisions receive a numeric suffix, no temporary file is used, and the exact path is shown after success. The OS-resolved known-folder target, including any Windows-managed redirection/junction, is trusted as the destination.

The Windows executable shipped with version `0.3.0` is **not Authenticode-signed**. Windows can show SmartScreen or low-reputation warnings. The project does not recommend disabling or bypassing Defender, SmartScreen or organization policy. The published SHA-256 can detect different bytes but does not authenticate Dennis Hilk as publisher; Authenticode signing remains future hardening.

### Advanced PowerShell reference

[`Collect-LinuxMigrationHardware.ps1`](../public/collectors/windows/Collect-LinuxMigrationHardware.ps1) remains the complete readable PowerShell reference implementation, advanced manual method and debugging aid. It is not the beginner path. If local policy permits scripts, its command remains:

```powershell
powershell.exe -NoProfile -File .\Collect-LinuxMigrationHardware.ps1
```

Its default output is a new timestamped JSON file in the current directory. `FileMode.CreateNew` prevents overwrite; the file inherits that directory's Windows ACL. A user-selected parent directory or junction is trusted as the destination. Inspect the source before running, inspect JSON before import, then delete the JSON normally when no longer needed.

Manual QA on Windows 11 in Microsoft Edge on a Proxmox VM confirmed that the browser snapshot worked and correctly exposed only limited facts. The PowerShell collector then failed because local execution policy disabled scripts. This is not a PowerShell defect; it showed that a script/terminal workflow was inappropriate as the beginner-facing primary path. The project does not recommend `Bypass`, global policy changes, or weakening organizational policy. Use the executable, browser or manual evidence instead.

## Linux collector

[`collect-linux-hardware.py`](../public/collectors/linux/collect-linux-hardware.py) is both artifact and unminified source. It needs Python 3's standard library only. It uses no subprocess, shell, package manager, network API, `sudo`, root request, temporary file, auto-update, or external utility.

| Interface | Read allowlist | Purpose | Deliberately discarded/not read |
|---|---|---|---|
| `/etc/os-release` | `PRETTY_NAME` | Coarse current OS label | All other keys |
| `/proc/cpuinfo` | First model/vendor and `flags`/`Features` | CPU fact and `vmx`/`svm` support signal | All other lines/IDs |
| `/proc/meminfo` | `MemTotal` | Memory GiB | All other memory/process data |
| Python `platform.machine()`, `os.cpu_count()` | Architecture/count | System summary | No benchmark or timing fingerprint |
| `/sys/class/dmi/id/chassis_type` | Numeric chassis type | Coarse form factor | Product/system/board names, UUIDs and every serial field |
| `/sys/firmware/efi`, `efivars/SecureBoot-*` | EFI presence and the one Secure Boot data byte after four attribute bytes | Firmware/Secure Boot state when readable | No other EFI variable; no write/mount/change operation. See [kernel efivarfs format](https://docs.kernel.org/filesystems/efivarfs.html) |
| `/sys/bus/pci/devices` | `class`, four-digit `vendor`, four-digit `device` | GPU/audio/storage/USB-controller categories | Slot paths are not exported; no subsystem IDs or driver details. See [kernel PCI sysfs](https://docs.kernel.org/PCI/sysfs-pci.html) |
| `/sys/class/net`, `/sys/class/bluetooth` | Wireless/type marker and device ancestry to PCI/USB IDs | Wi-Fi/Ethernet/Bluetooth controller facts | Interface names are used only to traverse sysfs and never exported; address/MAC/IP/configuration/SSID are never read |
| `/sys/block` | Model, rotational flag, sector count, transport ancestry | Storage model/type/capacity | Serial, WWID, partition/volume names, mount points and user files |
| `/sys/bus/usb/devices` | `idVendor`, `idProduct`, interface class/subclass/protocol | USB audio, input, printer, video, Bluetooth and vendor-specific categories | Product/manufacturer/serial strings, topology paths and user data; ambiguous still-image class is `special_usb`, not asserted to be a scanner |
| `/sys/class/drm` | Connector `status` only | Connected-display count | Connector names, modes, EDID and serials |

The normal command is:

```bash
python3 ./collect-linux-hardware.py
```

It creates one timestamped JSON file in the current directory with mode `0600`, `O_EXCL`, and `O_NOFOLLOW` where supported. Existing files are never overwritten and a final-component symlink is rejected. The user-selected parent directory is trusted; a malicious parent-directory symlink/mount can still redirect writes, so run from a directory you control. `--stdout` exists for deterministic testing and writes no file. Inspect source and JSON, then delete the JSON normally when finished.

## Exact exclusions

No OS collector exports a username, real name, hostname/computer name, account, email, IP address, MAC address, SSID, Wi-Fi password/history, serial number, system/board/disk serial, product key, activation ID, machine GUID, TPM endorsement ID, browser history, file/document/directory listing, user-file content, shell history, environment secret, token, credential, SSH key, or cloud account. They do not dump raw command/API output. Each performs a recursive prohibited-key self-check before output, and tests validate the same denylist independently.

Hardware model names and four-digit PCI/USB vendor/device IDs are intentionally allowed because they are non-unique and materially useful for migration planning. A customized device description can still contain unexpected text; imported strings are bounded and inert, and users should inspect the JSON before import or sharing.

## Known limitations

- Collector source can be modified; an imported `source` value is not authenticated.
- The version `0.3.0` Windows executable is unsigned and may trigger SmartScreen/reputation warnings. The web UI identifies this before download; the checksum does not authenticate a publisher, and users should never bypass security controls.
- The executable has automated Windows-runner build/core coverage and ordinary-user Windows 11 Pro double-click QA. Representative real-hardware Windows 10 validation remains outstanding.
- Windows PowerShell policy may block the advanced script. The project provides no bypass.
- Windows Secure Boot remains unavailable without elevation; monitor count and CIM device lists can be incomplete or include inactive devices.
- Linux `/proc`/`/sys` availability varies by kernel, container, permissions, architecture and firmware. Missing data stays unknown/unavailable.
- USB class codes do not identify every peripheral precisely. Ambiguous classes are not upgraded into specific compatibility claims.
- Browser APIs are incomplete, privacy-reduced and browser-dependent. Firefox commonly lacks `deviceMemory` and WebGPU may be unavailable.
- Detection describes the current OS view, not the target distribution, kernel, driver, suspend/resume path, dock behavior or future updates.

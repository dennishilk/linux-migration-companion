# Linux Migration Companion

An explainable, local-first Windows-to-Linux migration advisor that helps people test whether Linux can replace Windows **before** they remove anything.

> **Website Release Candidate (`0.3.0-rc.2`):** no account, backend, analytics, telemetry, upload, package installation, partitioning, raw USB writing, bootloader changes, or in-app command execution. An optional read-only local collector can create a privacy-minimized hardware JSON file; detection never proves Linux compatibility.

[Current standalone test deployment](https://www.dennishilk.com/linux-migration-companion/) · [Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Decision model](docs/DECISION_MODEL.md)

The release-candidate branch is prepared for review; this repository does not assume that the current deployment contains the branch.

## What the release candidate does

The ten-stage DE/EN journey preserves the original visual and technical architecture while substantially expanding the evidence model:

1. **Fit Advisor:** 21 practical questions plus gaming-ecosystem selection.
2. **Distro comparison:** up to three relevant profiles, focused on migration, maintenance, NVIDIA, support, installation, troubleshooting, and recovery.
3. **Software Reality:** exactly 90 curated applications and workflows, with separate application/workflow scope and stable/volatile freshness labels.
4. **Hardware Evidence:** 19 evidence classes plus optional limited browser facts and auditable read-only Windows/Linux snapshot import. `SNAPSHOT DETECTED` remains distinct from `LIVE VERIFIED`.
5. **Live Test Assistant:** ten function-level tests on the real target machine; completed tests feed the corresponding hardware evidence.
6. **Migration Readiness:** explainable, non-numeric readiness plus a “Should I keep Windows?” strategy.
7. **Data Migration:** 19 data categories using `COPY`, `SYNC`, `EXPORT/IMPORT`, `RECONFIGURE`, `MANUAL CHECK`, or `DO NOT ASSUME`.
8. **Safe media handoff:** official downloads and verification guidance; the application never writes a device.
9. **Migration Passport 3.0:** strict local evidence record with optional snapshot provenance, JSON export/import, and explicit v1/v2-to-v3 migrations.
10. **First Boot Plan 2.0:** guided and fully explained plans covering what, why, risk, verification, and back-out—without executable commands.

No compatibility percentage is calculated or shown. Preference-based distro recommendations never override software or hardware blockers.

A separate, unnumbered **Support** destination follows the ten-stage journey. Support is voluntary; the complete tool stays free, local-first and tracking-free, with no paid or locked functionality.

The tea action uses Dennis Hilk's existing canonical [Buy Me a Coffee destination](https://buymeacoffee.com/dennishilk), verified from [dennishilk.com](https://dennishilk.com/) on 2026-08-11. The page also links to the website and this repository. It embeds no payment widget or third-party asset.

## Readiness vocabulary

The derived state is one of:

- `READY`
- `READY WITH CHECKS`
- `LIVE TEST REQUIRED`
- `WINDOWS SHOULD BE RETAINED`
- `BLOCKED`
- `INSUFFICIENT EVIDENCE`

The related strategy is one of Linux primary, test first, dual boot, keep Windows temporarily, keep Windows for specific workflows, or migration blocked. Every result includes its reasons and unresolved evidence.

## Deliberate recommendation gates

Gaming by itself is **never** enough to select CachyOS or Nobara. A beginner with NVIDIA graphics, Steam, low maintenance tolerance, and guided troubleshooting remains near Mint, Zorin, and Ubuntu.

- CachyOS requires critical gaming **and** sufficient Linux experience, troubleshooting confidence, active maintenance, and explicit rolling-release acceptance.
- Nobara rises only for a matching experienced gaming/content-creation specialist; beginner or minimal-maintenance use is capped.
- NixOS requires explicit interest in declarative configuration-as-code.
- Arch requires explicit manual-build intent plus advanced experience, terminal confidence, troubleshooting, and rolling-release acceptance.
- Gentoo requires the complete expert/compile-control persona.

The UI does not expose the internal ordinal score. Hard gates and blockers always take precedence. See [the decision-model specification](docs/DECISION_MODEL.md) and [`src/engine/recommend.ts`](src/engine/recommend.ts).

## Distribution scope

| Profile | Content depth | Role |
|---|---|---|
| Linux Mint 22.3 Cinnamon | Guided | Conservative, familiar mainstream path |
| Zorin OS 18.1 Core | Guided | Polished Windows-migrant path |
| Ubuntu 26.04 LTS | Guided | Broad mainstream reference |
| Fedora KDE 44 | Guided | Current KDE/mainstream path |
| Debian 13 KDE Live | Guided | Conservative community path |
| openSUSE Tumbleweed KDE | Guided | Explicit rolling KDE path |
| CachyOS Desktop | Reference | Experienced performance/gaming path |
| Nobara Linux | Reference | Experienced gaming/creation specialist path |
| NixOS 26.05 | Experimental | Declarative system model |
| Arch Linux | Reference | Manual rolling system |
| Gentoo Linux | Reference | Expert compile/control system |

“Guided” describes this project’s content depth, not a guarantee or endorsement. Every installation hands off to current official documentation. See [SUPPORTED_DISTROS.md](SUPPORTED_DISTROS.md).

## Run locally

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
npm run dev
```

Quality gate:

```bash
npm run qa
```

The gate runs ESLint, strict TypeScript, 100+ deterministic/unit/UI/adversarial tests, and the production build. CI additionally audits production dependencies; CodeQL and Dependabot are configured separately.

For the project subpath build:

```bash
VITE_BASE_PATH=/linux-migration-companion/ npm run build
```

## Architecture and safety boundary

The artifact is a static React/TypeScript application. All rules and curated data ship in the bundle; user choices are evaluated in the browser. Local storage contains only the versioned Passport, including at most one optional snapshot. Export/import and browser snapshot capture are explicit.

The following remain outside the trust boundary:

- automatic browser enumeration of PCI/USB devices or firmware state;
- any collection of serial numbers, accounts, network identifiers, user file names/content, or secrets;
- deciding that hardware works without a representative test;
- downloading an image or verifying a checksum on the user’s behalf;
- opening raw storage devices or writing media;
- partitioning, installing, changing bootloaders, installing packages, or running commands;
- generating NixOS hardware, disk, boot, secret, or credential configuration.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Optional Hardware Snapshot

Manual evidence remains the complete default path. The optional browser route records only coarse, possibly privacy-reduced platform, logical-processor, memory and WebGPU-availability facts; it identifies no device. The primary Windows path is a small portable `.exe` built from the auditable C# source in [`collectors/windows-exe`](collectors/windows-exe). It implements collection directly through local WMI and documented Win32 APIs, makes no network request, requests no elevation, installs nothing, and writes one create-new JSON file to Downloads. The readable PowerShell implementation remains an advanced reference/manual fallback. The Linux Python collector remains an unminified, standard-library source file.

Snapshot schema v1 is strict, closed, limited to 128 KiB/depth 8 and treated as untrusted input. Imported facts can set an existing class to `KNOWN FACT`; they cannot mark it required, pass a live test, or assert Linux support. The exact APIs, fields, discarded fields, privacy audit, execution-policy limitation and output-path behavior are documented in [Hardware Snapshot design and collector audit](docs/HARDWARE_SNAPSHOT.md). The machine-readable contract is [`schemas/hardware-snapshot.schema.json`](schemas/hardware-snapshot.schema.json).

## Migration Passport 3.0

Passport v3 contains advisor answers, up to three comparison profiles, software/workflow requirements, 19 hardware evidence records, optional validated snapshot provenance, ten live-test results, data-migration selections, media progress, and the chosen distro. Derived readiness remains recomputable rather than being stored as an unchallengeable fact.

Imports are limited to 256 KiB and depth 12. Objects are strict; IDs are closed against the current catalog; comparison IDs are unique and capped; text is bounded; contradictory required/not-applicable hardware evidence is rejected. Existing strict Passport v1 and v2 files are explicitly migrated to v3 without inventing snapshot or live evidence.

Browser storage is convenience, not backup. Snapshot model names and non-unique PCI/USB IDs can be sensitive in context, so inspect exports before sharing. Never put passwords, private keys, recovery codes, or licence keys in notes. The machine-readable v3 contract is in [`schemas/migration-passport.schema.json`](schemas/migration-passport.schema.json).

## Current limitations and release gate

- The release-candidate Windows `.exe` is currently **unsigned**. SmartScreen or reputation warnings are therefore a public-release blocker; never disable or bypass Windows security controls. See [the signing and release plan](docs/WINDOWS_COLLECTOR_RELEASE.md).
- The executable targets .NET Framework 4.8 because it is included in stock Windows 10 22H2 and Windows 11. No developer tooling is required. Windows Secure Boot remains deliberately `unavailable` to preserve ordinary-user execution.
- The executable still requires ordinary-user, double-click QA on real Windows 10 and Windows 11 hardware. A Windows GitHub runner build and automated core tests are necessary but not a substitute.
- The PowerShell reference may be blocked by execution policy. This is a beginner-path product limitation, not a PowerShell bug; the project recommends no bypass or policy weakening.
- Software records describe supported routes and representative verification; they do not promise that a document, plug-in, game, anti-cheat system, peripheral, or organization policy works.
- The catalog is a maintained snapshot reviewed on **2026-08-11**, not a live compatibility service. Volatile entries are labelled and must be rechecked.
- Live-session success does not prove that an installed system will behave identically after future updates or driver changes.
- The app cannot make dual boot, firmware, backups, or partitioning risk-free.
- Search indexing is enabled for the single canonical application URL. Query-driven `?step=` states retain deep-linking but canonicalize to the application root; no artificial localized URLs or `hreflang` alternates are published. The project ships a one-URL subpath sitemap, while the production root sitemap remains owned by the main website integration.
- Real-browser QA of the release-candidate branch is required before public linking; automated DOM tests are not a substitute.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Decision model and invariants](docs/DECISION_MODEL.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Hardware Snapshot design and collector audit](docs/HARDWARE_SNAPSHOT.md)
- [Windows collector build, checksum and signing plan](docs/WINDOWS_COLLECTOR_RELEASE.md)
- [Manual QA checklist](docs/MANUAL_QA.md)
- [Data maintenance](docs/DATA_MAINTENANCE.md)
- [Privacy](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Status and non-affiliation

This repository is a website release candidate, not a compatibility certification. It is not affiliated with or endorsed by any listed Linux distribution, software vendor, or media-writer project. Names and trademarks belong to their respective owners.

## Authorship and license

© 2026 Dennis Hilk  
Linux Migration Companion  
Licensed under the [MIT License](LICENSE).

# Linux Migration Companion

An explainable, local-first Windows-to-Linux migration advisor that helps people test whether Linux can replace Windows **before** they remove anything.

> **Website Release Candidate (`0.2.0-rc.1`):** no account, backend, analytics, device scan, package installation, partitioning, raw USB writing, bootloader changes, privilege requests, or command execution. Compatibility remains `UNKNOWN` until representative evidence exists.

[Current standalone test deployment](https://www.dennishilk.com/linux-migration-companion/) · [Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Decision model](docs/DECISION_MODEL.md)

The release-candidate branch is prepared for review; this repository does not assume that the current deployment contains the branch.

## What the release candidate does

The ten-stage DE/EN journey preserves the original visual and technical architecture while substantially expanding the evidence model:

1. **Fit Advisor:** 21 practical questions plus gaming-ecosystem selection.
2. **Distro comparison:** up to three relevant profiles, focused on migration, maintenance, NVIDIA, support, installation, troubleshooting, and recovery.
3. **Software Reality:** exactly 90 curated applications and workflows, with separate application/workflow scope and stable/volatile freshness labels.
4. **Hardware Evidence:** 19 manually recorded hardware classes with `KNOWN FACT`, `USER REPORTED`, `LIVE VERIFIED`, `UNKNOWN`, and failure states.
5. **Live Test Assistant:** ten function-level tests on the real target machine; completed tests feed the corresponding hardware evidence.
6. **Migration Readiness:** explainable, non-numeric readiness plus a “Should I keep Windows?” strategy.
7. **Data Migration:** 19 data categories using `COPY`, `SYNC`, `EXPORT/IMPORT`, `RECONFIGURE`, `MANUAL CHECK`, or `DO NOT ASSUME`.
8. **Safe media handoff:** official downloads and verification guidance; the application never writes a device.
9. **Migration Passport 2.0:** strict local evidence record, JSON export/import, and explicit v1-to-v2 migration.
10. **First Boot Plan 2.0:** guided and fully explained plans covering what, why, risk, verification, and back-out—without executable commands.

No compatibility percentage is calculated or shown. Preference-based distro recommendations never override software or hardware blockers.

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

The artifact is a static React/TypeScript application. All rules and curated data ship in the bundle; user choices are evaluated in the browser. Local storage contains only the versioned Passport. Export is explicit.

The following remain outside the trust boundary:

- reading PCI/USB identifiers, firmware state, serial numbers, accounts, or documents;
- deciding that hardware works without a representative test;
- downloading an image or verifying a checksum on the user’s behalf;
- opening raw storage devices or writing media;
- partitioning, installing, changing bootloaders, installing packages, or running commands;
- generating NixOS hardware, disk, boot, secret, or credential configuration.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Migration Passport 2.0

Passport v2 contains advisor answers, up to three comparison profiles, software/workflow requirements, 19 hardware evidence records, ten live-test results, data-migration selections, media progress, and the chosen distro. Derived readiness remains recomputable rather than being stored as an unchallengeable fact.

Imports are limited to 256 KiB and depth 12. Objects are strict; IDs are closed against the current catalog; comparison IDs are unique and capped; text is bounded; contradictory required/not-applicable hardware evidence is rejected. Existing strict Passport v1 files are migrated explicitly without inventing live verification.

Browser storage is convenience, not backup. Inspect exports before sharing, and never put passwords, private keys, recovery codes, or licence keys in notes. The machine-readable v2 contract is in [`schemas/migration-passport.schema.json`](schemas/migration-passport.schema.json).

## Current limitations and release gate

- The native Windows hardware scanner remains intentionally deferred. A web page cannot obtain trustworthy device IDs or Secure Boot state, and a native binary would require a separate privacy, signing, update, and security program.
- Software records describe supported routes and representative verification; they do not promise that a document, plug-in, game, anti-cheat system, peripheral, or organization policy works.
- The catalog is a maintained snapshot reviewed on **2026-08-11**, not a live compatibility service. Volatile entries are labelled and must be rechecked.
- Live-session success does not prove that an installed system will behave identically after future updates or driver changes.
- The app cannot make dual boot, firmware, backups, or partitioning risk-free.
- Search indexing remains intentionally disabled in both page metadata and `robots.txt`. Dennis must explicitly remove that gate only when public integration is approved.
- Real-browser QA of the release-candidate branch is required before public linking; automated DOM tests are not a substitute.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Decision model and invariants](docs/DECISION_MODEL.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Manual QA checklist](docs/MANUAL_QA.md)
- [Data maintenance](docs/DATA_MAINTENANCE.md)
- [Privacy](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)

## Status and non-affiliation

This repository is a website release candidate, not a compatibility certification. It is not affiliated with or endorsed by any listed Linux distribution, software vendor, or media-writer project. Names and trademarks belong to their respective owners.

Licensed under the [MIT License](LICENSE).

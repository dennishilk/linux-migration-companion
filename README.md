# Linux Migration Companion

An explainable, local-first Alpha that helps Windows users decide whether Linux is a realistic fit **before** they remove anything.

> **Alpha test preview:** no account, backend, analytics, device scan, package installation, partitioning, raw USB writing, bootloader changes, or command execution. Compatibility remains `UNKNOWN` until the user records representative evidence.

[Open the standalone Alpha](https://dennishilk.github.io/linux-migration-companion/) · [Privacy](PRIVACY.md) · [Security](SECURITY.md) · [Decision model](docs/DECISION_MODEL.md)

## What works in this Alpha

- A 21-question DE/EN Fit Advisor plus gaming-ecosystem selection.
- Deterministic recommendations for 11 deliberately different distributions.
- Reasons, trade-offs, triggering answers, and change factors—never invented compatibility percentages.
- A curated assessment of exactly 60 applications and workflows with native, web, compatibility, alternative, partial, and no-equivalent routes.
- Essential software can override a positive distro fit with a hard blocker.
- Honest, manual hardware evidence with `UNKNOWN` as a first-class state.
- A 10-item Live Test Assistant for the actual target machine.
- Safe media preparation that links to official downloads and established writers; the app never accesses a drive.
- A schema-validated Migration Passport that stays in browser storage and can be exported/imported as JSON.
- A personalized, non-executing First Boot plan.
- Responsive layouts for mobile, tablet, conventional desktop, 1920 px, and ultrawide viewports.

## Deliberate recommendation gates

Gaming by itself is **never** enough to select CachyOS or Nobara. In particular, a beginner with NVIDIA graphics, Steam, low maintenance tolerance, and guided troubleshooting remains near Mint, Zorin, and Ubuntu.

- CachyOS requires critical gaming **and** sufficient Linux experience, troubleshooting confidence, active maintenance, and explicit rolling-release acceptance.
- Nobara rises for an experienced gaming/content-creation specialist; beginner or minimal-maintenance use is capped.
- NixOS requires explicit interest in declarative configuration-as-code.
- Arch requires explicit manual-build intent plus advanced experience, terminal confidence, troubleshooting, and rolling-release acceptance.
- Gentoo requires the complete expert/compile-control persona.

The UI does not show the internal ordinal score. Hard gates and blockers always take precedence. See [the decision-model specification](docs/DECISION_MODEL.md) and the readable implementation in [`src/engine/recommend.ts`](src/engine/recommend.ts).

## Distribution scope

| Profile | Alpha support depth | Role |
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

“Guided” describes the depth of this Alpha’s content, not a guarantee or endorsement. Every installation still hands off to current official documentation. Details and source links are in [SUPPORTED_DISTROS.md](SUPPORTED_DISTROS.md).

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

The gate runs ESLint, strict TypeScript, 52 deterministic/unit/UI tests, and the production build. GitHub Actions additionally audits production dependencies; CodeQL and Dependabot are configured separately.

## Architecture and safety boundary

The deployed artifact is a static React/TypeScript application. All rules and curated data ship with it; user choices are evaluated inside the browser. Local storage contains only the versioned Passport. Export is explicit.

The following remain outside the trust boundary:

- reading PCI/USB identifiers, firmware state, serial numbers, accounts, or documents;
- deciding that hardware works without a live test;
- downloading an image on the user’s behalf;
- verifying a checksum on the user’s behalf;
- opening raw storage devices or writing media;
- partitioning, installing, changing bootloaders, installing packages, or running commands;
- generating NixOS hardware configuration, disk layout, secrets, or credentials.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Migration Passport

Passport schema version 1 is strict: unknown fields, unknown distro/software identifiers, oversized files, excessive nesting, and notes longer than 1,000 characters are rejected. Imports are limited to 256 KiB. The machine-readable contract is in [`schemas/migration-passport.schema.json`](schemas/migration-passport.schema.json).

Browser storage is convenience, not backup. Export the JSON file if the evidence matters, inspect it before sharing, and treat it as potentially sensitive because it describes software and migration preferences.

## Current limitations

- The proposed read-only Windows hardware scanner was deferred for Alpha. A web page cannot obtain trustworthy device IDs or Secure Boot state, and a rushed native scanner would expand the attack and privacy surface.
- Software entries describe routes and questions to verify; they do not promise that a specific document, plug-in, game, anti-cheat system, peripheral, or organization policy works.
- The catalog is a maintained snapshot reviewed on **2026-08-10**, not a live compatibility service.
- Official pages and supported versions change. Follow the linked project/vendor pages at decision time.
- Live-session success does not prove an installed system will remain identical after updates or driver changes.
- The app cannot make dual boot, firmware, backups, or partitioning risk-free.

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

This repository is a public experimental Alpha. It is not affiliated with or endorsed by any listed Linux distribution, software vendor, or media-writer project. Names and trademarks belong to their respective owners.

Licensed under the [MIT License](LICENSE).

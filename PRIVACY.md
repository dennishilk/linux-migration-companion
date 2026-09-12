# Privacy

Last reviewed: 2026-09-12

Linux Migration Companion is designed as a static, local-first web application.

## Data processing

Version `0.3.0` has no application backend, user account, analytics, advertising, telemetry, third-party font request, or hardware upload. Advisor answers, selected/comparison distributions, software/workflow priorities, hardware evidence, an optional validated snapshot, live-test results, data-migration selections, media progress, and locale are evaluated and stored in the browser as a versioned Migration Passport.

The application and optional collectors deliberately do **not** collect or export:

- names of people, email, username, hostname/computer name, or account details;
- IP/MAC addresses, SSIDs, Wi-Fi history/passwords, network configuration, or cloud-account data;
- serial/system/board/disk numbers, product/activation keys, machine GUIDs, or TPM endorsement IDs;
- files, file/document/directory names or contents, photos, browser/shell history, environment secrets, tokens, credentials, SSH/recovery keys, or installed-app dumps.

The optional collectors may export selected non-unique hardware model names, coarse system facts, and four-digit PCI/USB vendor/device IDs because those facts materially support migration planning. The browser-only route uses a few feature-detected APIs and labels processor/memory values as possibly privacy-reduced; it does not use aggressive fingerprinting or identify a GPU renderer. Every exact read and discard decision is in [the Hardware Snapshot audit](docs/HARDWARE_SNAPSHOT.md).

Static hosting infrastructure may process ordinary HTTP connection data under the host’s own policies. Following an external source, catalog correction, or voluntary Support link leaves this application and is subject to the destination’s privacy policy. Catalog correction links open a GitHub issue form only after the user activates them and prefill only the selected record's catalog type, name, ID, review date, and public source URL. They do not include Migration Passport, hardware, browser/device, or unrelated application state; submitting the issue remains a separate user action. The Support page embeds no payment script, image, tracker or remote content; the third-party destination is contacted only after the user activates its link.

## Browser storage

The key `linux-migration-companion:passport:v3` is stored in `localStorage`. Legacy v1/v2 keys can be read and explicitly migrated, then are removed on the next successful v3 save. Data remains on that browser profile until the user clears site data or confirms “Start over / Neu beginnen.” That reset removes only the app-owned v1/v2/v3 keys, preserves the selected language in the fresh state, and does not broadly clear site storage. Private/incognito browsing may discard data earlier.

Browser storage is not encrypted by the application and is accessible to scripts running under the same origin. This repository deliberately avoids third-party runtime scripts, but users should still avoid entering secrets into free-text notes.

## Export and import

Passport export creates a JSON download only after a user action. The file can reveal software choices, migration constraints and optional hardware facts. Inspect it before sharing and protect it like any personal planning document.

The separate “Copy summary / Zusammenfassung kopieren” action runs only after an explicit click and writes a plain-text, high-level migration overview to the local clipboard. It may name intentionally selected blocking software, generic hardware categories, readiness/strategy, distro candidates, and generic next actions. It excludes free-form notes, snapshot facts and identifiers, raw Passport JSON, filesystem paths, browser/device metadata, and unrelated local state. Nothing is uploaded.

Passport import is local. Files are limited to 256 KiB and depth 12, then validated against a strict schema. Unknown keys/IDs, excess/duplicate items, overlong text, contradictory required/not-applicable hardware, excessive nesting, and invalid versions are rejected. Strict v1/v2 files are explicitly migrated to v3 without inventing snapshot or live evidence. The file is never uploaded.

Hardware snapshot import is separately limited to 128 KiB and depth 8. It rejects extra/unsafe/private keys, unknown versions/categories, contradictory sources, malformed text and all non-data structures before state use. A file claiming to be official is still untrusted. The app stores only the current validated snapshot inside Passport v3.

## Collector operation

The collectors are optional, local and read-only. They have no network client, account, analytics, telemetry or auto-update. Each writes one new JSON file, performs a deterministic prohibited-key self-check, and never dumps raw command/API output. The user is told to inspect and delete that file when finished. Hardware detection remains factual provenance, not Linux compatibility.

The primary Windows executable requests ordinary-user `asInvoker` execution, directly reads a closed local WMI/Win32 allowlist, enumerates no user files, and creates a fixed-name, create-new JSON file in the OS-resolved Downloads folder (Desktop/Documents fallback). It deliberately leaves Secure Boot unavailable rather than elevating. The artifact is currently unsigned; the project recommends no SmartScreen/Defender bypass. The PowerShell source remains an advanced reference and may be blocked by execution policy; the project recommends no execution-policy bypass. The Linux script uses standard-library Python only, no `sudo`, packages, shell/subprocess or network, and creates output mode `0600` without overwriting an existing final path.

## Deletion

Confirm “Start over / Neu beginnen” or clear this site's browser data. Delete exported Passport and collector JSON files through the operating system if they are no longer needed; the browser cannot delete files after download/import.

Privacy-relevant bugs should be reported through the process in [SECURITY.md](SECURITY.md).

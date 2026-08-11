# Privacy

Last reviewed: 2026-08-11

Linux Migration Companion is designed as a static, local-first web application.

## Data processing

The release candidate has no application backend, user account, analytics, advertising, telemetry, fingerprinting, or third-party font request. Advisor answers, selected/comparison distributions, software/workflow priorities, manual hardware evidence, live-test results, data-migration selections, media progress, and locale are evaluated and stored in the browser as a versioned Migration Passport.

The application does **not** automatically collect or inspect:

- name, email, username, hostname, IP address, or account details;
- serial numbers, MAC addresses, PCI/USB identifiers, or firmware identifiers;
- files, file names, documents, photos, browser history, or installed-app lists;
- passwords, licence keys, secrets, disk layouts, or recovery keys.

Static hosting infrastructure may process ordinary HTTP connection data under the host’s own policies. Following an external source/download link leaves this application and is subject to the destination’s privacy policy.

## Browser storage

The key `linux-migration-companion:passport:v2` is stored in `localStorage`. A legacy v1 key can be read and migrated, then is removed on the next successful v2 save. Data remains on that browser profile until the user resets site data, clears browser storage, or uses “Reset local Passport.” Private/incognito browsing may discard it earlier.

Browser storage is not encrypted by the application and is accessible to scripts running under the same origin. This repository deliberately avoids third-party runtime scripts, but users should still avoid entering secrets into free-text notes.

## Export and import

Export creates a JSON download only after a user action. The file can reveal software choices and migration constraints. Inspect it before sharing and protect it like any personal planning document.

Import is local. Files are limited to 256 KiB and depth 12, then validated against a strict schema. Unknown keys and IDs, excess comparison items, duplicate IDs, overlong notes, contradictory required/not-applicable hardware, excessive nesting, and invalid versions are rejected. Strict v1 files are explicitly migrated without inventing live verification. The file is not uploaded by this application.

## Hardware scanner decision

The proposed Windows hardware scanner is deferred. The browser cannot obtain sufficient trustworthy evidence, and the release candidate does not ship a native executable that could enumerate identifiers. Manual notes and live-test results keep the privacy and trust boundary visible.

## Deletion

Use “Reset local Passport” or clear this site’s browser data. Delete exported JSON files through the operating system if they are no longer needed.

Privacy-relevant bugs should be reported through the process in [SECURITY.md](SECURITY.md).

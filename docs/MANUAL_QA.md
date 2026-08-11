# Manual QA checklist

Record browser/version, operating system, viewport, zoom, commit SHA, date, console errors, failed requests, and any deviation. Never use real secrets or a sensitive Passport.

## Required browser and viewport matrix

- Chromium current: 390×844, 768×1024, 1366×768, 1920×1080, 2560×1440.
- Firefox current: 390×844, 1366×768, 1920×1080.
- WebKit/Safari-equivalent where available: 390×844 and desktop.
- Keyboard-only pass at desktop width.
- Browser zoom at 200%.
- `prefers-reduced-motion: reduce` pass.
- One short-height desktop and one ultrawide check for navigation/card density.

## Core ten-stage journey

- [ ] Fresh load shows release-candidate, local-only, no-tracking, and no-disk-write boundaries.
- [ ] The skip link is first, visible on focus, localized, and moves focus to the main content.
- [ ] DE → EN → DE changes current UI, document language/title, and long copy without losing state.
- [ ] All five Advisor groups open; every choice remains selected while navigating.
- [ ] Default persona shows Mint, Zorin, Ubuntu in that order.
- [ ] Results contain reasons, trade-offs, triggering answers, change factors, and no percentage.
- [ ] Comparison accepts 0–3 unique distros, disables a fourth, remains usable on mobile, and never upgrades a specialist tier.
- [ ] Software search/category/add/remove/priority controls work with all 90 records.
- [ ] Application/workflow scope, volatile/stable label, official source, and review date are visible.
- [ ] Essential Photoshop/Creative Cloud produces a hard blocker and keep-Windows-for-workflows strategy.
- [ ] Essential enterprise VPN produces Windows-retained-until-tested, not a false vendor-support claim.
- [ ] All 19 hardware classes support required, evidence state, and 500-character details.
- [ ] Hardware Snapshot offers manual, limited browser, and validated JSON-import routes; the manual route remains complete.
- [ ] `DETECTED FACT ≠ LINUX VERIFIED` is visible and no import marks a class required, compatible, or live-verified.
- [ ] Selecting a GPU vendor alone leaves graphics compatibility `UNKNOWN`.
- [ ] Required + `NOT APPLICABLE` cannot coexist through the UI.
- [ ] NVIDIA guidance never hard-codes a driver version.
- [ ] All ten live-test rows support four states; linked evidence becomes live-verified/failed/not-applicable correctly.
- [ ] Reverting a live result does not preserve a false live-verification state.
- [ ] Readiness exposes the exact state, strategy, reasons, open checks, and blockers.
- [ ] A software blocker or required hardware failure can never produce `READY`.
- [ ] Empty/default evidence produces `INSUFFICIENT EVIDENCE`.
- [ ] Data plan covers all 19 categories, six methods, backup warning, cloud placeholders, encryption, Fast Startup/NTFS, and active databases.
- [ ] Media guide uses selected distro’s official links and offers no raw-write action.
- [ ] Passport 3.0 summarizes distros, software, blockers, required hardware, snapshot provenance, live tests, strategy, data, gaming, and unknowns.
- [ ] Passport preview matches stored data; export downloads valid schema-v3 JSON.
- [ ] Strict v1/v2 imports migrate without a snapshot or invented live evidence; valid v3 imports; malformed/extra/oversized/deep/unknown/stale/contradictory files fail safely.
- [ ] Markup-like notes render as text and create no DOM element or console error.
- [ ] `Start over` / `Neu beginnen` opens the reset dialog without changing progress on the first click.
- [ ] Cancel or Escape preserves progress, traps focus while open, and returns focus to the reset control.
- [ ] Confirmed reset clears only the app-owned v1/v2/v3 keys including snapshot state, preserves locale/unrelated storage, removes `?step=`, and creates a schema-valid default Passport at step 1.
- [ ] First Boot 2.0 responds to blockers, NVIDIA, Steam, browser/office, identity, cloud, printer, Bluetooth, displays, development, media, unresolved hardware, and NixOS.
- [ ] Guided mode stays concise; explanation mode shows WHAT, WHY, RISK, VERIFY SUCCESS, and BACK OUT for every step.
- [ ] Support follows First Boot after a visual separator but remains outside the ordered 01–10 list and never becomes `?step=11`.
- [ ] Support is voluntary, opens no popup/interstitial, locks no feature, loads no third-party content before link activation, and shows the verified tea, website and GitHub destinations in DE/EN.
- [ ] English evidence/freshness/options/readiness copy uses the reviewed colon, semicolon, comma and parenthetical forms with no visually excessive dash run. Command options such as `--stdout` remain unchanged.
- [ ] No control executes commands, installs software, requests privilege, partitions, writes media, or changes a bootloader.

## Hardware Snapshot release procedure

### A. Windows 10 and Windows 11

- [ ] On one ordinary non-administrator Windows 10 machine and one Windows 11 machine, download `LinuxMigrationCompanion-HardwareSnapshot.exe` from the candidate site and verify its SHA-256 against the published checksum and candidate commit/build record.
- [ ] Confirm the release candidate is visibly documented as unsigned. Record the exact Defender/SmartScreen/reputation UX. Do not disable or bypass any control. Repeat the public-release pass only after Authenticode signing and confirm the expected Dennis Hilk publisher identity.
- [ ] Double-click the `.exe` without a terminal. Confirm the calm DE/EN UI, complete privacy list, predictable Downloads destination, Create hardware snapshot, success filename, Open folder and Close all work by mouse and keyboard at 100% and 200% scaling.
- [ ] Confirm no UAC/elevation prompt, installer, service, registry/package/driver/configuration change, browser/backend request, telemetry, update check, child command process, temporary file or additional output appears. The only write should be one new timestamped JSON file in Downloads.
- [ ] Create twice within one second or pre-create the expected name; confirm the first file is never overwritten and a numeric suffix is used. Make Downloads unavailable in a disposable account and verify the documented fallback/failure UI without stray output.
- [ ] Open the JSON as text before import. Search case-insensitively for username, real/host/computer name, email, IP/MAC/SSID, serial, product/activation key, machine GUID, TPM, file/document names/content, tokens and credentials; confirm none exists.
- [ ] Compare CPU, GPU(s), Wi-Fi/Ethernet/Bluetooth, audio, storage, USB controller, webcam/fingerprint and monitor count against Device Manager/System Information. Record every absent, extra/inactive or ambiguous entry. Secure Boot must say `unavailable`, not guess.
- [ ] Import the JSON in EN and DE. Confirm source is explicitly a claimed Windows collector, detected facts are visible, required flags/live tests are unchanged, and readiness remains conservative.
- [ ] Delete the `.exe` and JSON normally and confirm the system configuration is unchanged.
- [ ] Separately inspect the advanced PowerShell source. Do not change execution policy and do not use `Bypass`; if policy blocks it, record that expected limitation and confirm the website points ordinary users to the executable/browser/manual paths.

### B. Linux

- [ ] On a representative physical Linux laptop or desktop, open and compare the Python source at the candidate SHA; run `python3 ./collect-linux-hardware.py` as a normal user, without `sudo` or package installation.
- [ ] Confirm no network request, privilege prompt, shell/subprocess, temporary file or system change. Confirm one new mode-`0600` JSON is created and an existing filename is never overwritten.
- [ ] Inspect/search JSON for the same prohibited fields as Windows. Compare reported CPU, PCI graphics/audio/storage/USB controllers, network/Bluetooth controllers, block storage, USB class devices, firmware/Secure Boot and display count against known local hardware. Record kernel/permission/container omissions as unknown, not failure.
- [ ] Import, verify provenance/evidence separation, then delete the JSON. Also run `python3 ./collect-linux-hardware.py --stdout` and confirm it creates no file.

### C. Browser

- [ ] In current Chrome/Chromium and Firefox, record a browser snapshot and compare exactly what each exposes. Firefox/missing `deviceMemory`, UA-CH or WebGPU must render as unavailable without an error.
- [ ] Repeat on a mobile browser. Confirm no permission prompt, device list, renderer name, GPU vendor, USB/HID/media enumeration or network request occurs.
- [ ] Disable/block an available API where devtools/browser settings permit; confirm graceful unavailable labels and zero device facts.

### Recorded real-world context before 0.3.0-rc.2

- Real Windows 11 in Microsoft Edge on a Proxmox VM: browser snapshot succeeded and correctly reported limited facts.
- The PowerShell collector on that same ordinary Windows 11 test path was blocked because local execution policy disabled scripts. This is recorded as a beginner-path product/release issue, not a PowerShell bug; no policy bypass was used.
- The Linux Python collector ran on real Linux bare metal and its JSON imported correctly.
- These results do **not** count as manual execution of the new `.exe`. Windows 10 and Windows 11 double-click, output, privacy, scaling and SmartScreen/signature QA above remain open.

### D. Evidence and readiness

- [ ] Import a snapshot with Wi-Fi and GPU. Mark Wi-Fi required: detected + not tested must produce `LIVE TEST REQUIRED`, not ready.
- [ ] Explicitly mark the linked Wi-Fi live test `Works`: evidence becomes `LIVE VERIFIED`. Revert to not tested: it returns to snapshot `KNOWN FACT`.
- [ ] Mark the same test `Issue`: evidence becomes `FAILED TEST`, readiness blocks/retains Windows as before.
- [ ] Confirm an unidentified required printer/fingerprint/special device remains `UNKNOWN`.

### E. Passport

- [ ] Export Passport v3, inspect the embedded acquisition/source/collector/facts, reload, and re-import. Provenance and manual/live distinctions must survive exactly.
- [ ] Import known-good v1 and v2 files. Both must become v3 with `snapshot: null` and no invented live state.

### F. Reset

- [ ] With a snapshot and other progress stored, open Start over; first click changes nothing. Cancel, reopen, press Escape, and verify state/focus are preserved.
- [ ] Confirm reset and verify snapshot/progress are removed, step 1 is shown without `?step=`, language is retained, Passport v3 is schema-valid, and a foreign `localStorage` test key survives.

## Adversarial personas

Run each from a reset Passport and record top recommendations, readiness, Windows strategy, and any nonsense:

1. Absolute Windows beginner.
2. Windows 11 complex-office user.
3. Adobe-dependent creative professional.
4. Casual Steam gamer.
5. Competitive Riot/Xbox multiplayer gamer.
6. NVIDIA gamer with Secure Boot required.
7. AMD gamer.
8. Laptop user.
9. Hybrid-GPU laptop with dock/external monitors.
10. Cross-platform developer.
11. CAD/Autodesk professional.
12. Privacy-conscious user.
13. Experienced mainstream Linux user.
14. Explicit Arch/CachyOS candidate.
15. Explicit NixOS candidate.
16. Exact Gentoo expert and one near-miss.
17. Printer/scanner-dependent user.
18. Keyboard/screen-reader/zoom accessibility user.
19. User leaving almost everything `UNKNOWN`.
20. Contradictory/maximum-selection/long-note edge-case user.
21. Windows 11 hybrid Intel/NVIDIA laptop.
22. NVIDIA desktop with USB Wi-Fi.
23. Detected Wi-Fi whose Linux live test fails.
24. Detected fingerprint reader left untested.
25. Desktop with multiple storage devices.
26. Current Linux machine evaluating a different target distribution.
27. User-modified but structurally valid snapshot.
28. Unknown/new Unicode device description.
29. User who assumes detected means supported; verify corrective copy/readiness.
30. Snapshot that cannot identify an important device; `UNKNOWN` must survive.

Attempt to bypass every specialist gate and force `READY` while Photoshop, failed Wi-Fi, failed suspend, essential `DO NOT ASSUME` data, or other blockers remain.

## Navigation, reload, and persistence

- [ ] `?step=` direct URLs open every stage under `/linux-migration-companion/`.
- [ ] Unknown step IDs fall back safely to the advisor.
- [ ] Back/forward restores stages without losing Passport state.
- [ ] Direct reload at every step succeeds and all assets use the configured base path.
- [ ] Refresh midway through Advisor, software, hardware, live test, and data plan preserves state.
- [ ] Storage-disabled/full behavior leaves the in-memory UI usable.
- [ ] The only application storage key after save is `linux-migration-companion:passport:v3`; legacy v1/v2 keys are removed and foreign keys survive reset.

## Responsive and accessibility

- [ ] No horizontal page overflow (the narrow side navigation may intentionally scroll).
- [ ] Cards do not overlap, clip controls, truncate critical status, or create kilometer-long lines.
- [ ] Sticky controls do not cover focused elements or the final card.
- [ ] The ten-item desktop navigation remains reachable at short heights.
- [ ] Visible focus follows a logical order; the reset dialog traps Tab focus only while open and releases it on Cancel, Escape, or confirmation.
- [ ] Button groups, selects, textareas, checkboxes, summaries, and file input trigger have accessible names.
- [ ] Snapshot workflow is keyboard-only operable; status/error announcements are read; collector details and hidden file input trigger retain logical focus order.
- [ ] Windows executable download and checksum links have clear accessible names; beginner steps wrap without overflow on mobile.
- [ ] Support is keyboard reachable after the numbered list; focus enters its main heading/content, the tea action has a meaningful accessible name, external links announce the new tab, and returning to a numbered stage works.
- [ ] Heading hierarchy is coherent after direct navigation.
- [ ] Status uses text and structure, not color alone; contrast remains legible.
- [ ] Long German labels wrap without overflow.
- [ ] 200% zoom preserves navigation and actions.
- [ ] Reduced motion removes smooth scrolling and transition duration.

## Network, security, and privacy

- [ ] DevTools Network shows only same-origin static assets until the user opens an external link.
- [ ] No analytics, font, telemetry, compatibility API, tracker, or service-worker request occurs.
- [ ] Console has no errors or warnings during the complete journey.
- [ ] External links are HTTPS and open with `noreferrer`.
- [ ] Export contains only documented optional hardware model/non-unique PCI/USB facts and no account, serial, file, network, browser-history or secret identifier.
- [ ] Production dependency audit reports no high/critical production vulnerability.
- [ ] CSP blocks inline script/object/form submission and no component uses unsafe HTML injection.

## Release and deployment gate

- [ ] `npm ci && npm run qa` passes from a clean checkout.
- [ ] `VITE_BASE_PATH=/linux-migration-companion/ npm run build` succeeds.
- [ ] CI web quality and Windows executable build/core-test jobs pass; JavaScript/TypeScript and C# CodeQL pass on the release-candidate SHA.
- [ ] Both public JSON schemas parse as JSON and match runtime fixture/output tests.
- [ ] Real Windows 10/11 executable and physical Linux collector results above are attached to the private release record; automated/static tests alone do not satisfy this gate.
- [ ] The public Windows executable is Authenticode-signed, signature-verified, hashed after signing and checked for real clean-machine SmartScreen behavior. Do not ship the current unsigned RC to beginners.
- [ ] A branch preview or equivalent serves the exact candidate SHA over HTTPS.
- [ ] Chromium and Firefox matrix above is performed against that SHA.
- [ ] Page title, description, canonical URL, favicon, and app identity are correct; the former `LM` mark is absent.
- [ ] The footer visibly presents `© 2026 Dennis Hilk`, `Linux Migration Companion`, and `Licensed under the MIT License`.
- [ ] `noindex,nofollow` and `robots.txt` remain in place until Dennis explicitly authorizes public indexing.
- [ ] Only after approval: remove both indexing gates in one reviewed change; do not change them implicitly during deployment.

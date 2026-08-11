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
- [ ] Passport 2.0 summarizes distros, software, blockers, required hardware, live tests, strategy, data, gaming, and unknowns.
- [ ] Passport preview matches stored data; export downloads valid schema-v2 JSON.
- [ ] Strict v1 import migrates; valid v2 imports; malformed/extra/oversized/deep/unknown/stale/contradictory files fail safely.
- [ ] Markup-like notes render as text and create no DOM element or console error.
- [ ] Reset requires confirmation and clears both v1 and v2 keys.
- [ ] First Boot 2.0 responds to blockers, NVIDIA, Steam, browser/office, identity, cloud, printer, Bluetooth, displays, development, media, unresolved hardware, and NixOS.
- [ ] Guided mode stays concise; explanation mode shows WHAT, WHY, RISK, VERIFY SUCCESS, and BACK OUT for every step.
- [ ] No control executes commands, installs software, requests privilege, partitions, writes media, or changes a bootloader.

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

Attempt to bypass every specialist gate and force `READY` while Photoshop, failed Wi-Fi, failed suspend, essential `DO NOT ASSUME` data, or other blockers remain.

## Navigation, reload, and persistence

- [ ] `?step=` direct URLs open every stage under `/linux-migration-companion/`.
- [ ] Unknown step IDs fall back safely to the advisor.
- [ ] Back/forward restores stages without losing Passport state.
- [ ] Direct reload at every step succeeds and all assets use the configured base path.
- [ ] Refresh midway through Advisor, software, hardware, live test, and data plan preserves state.
- [ ] Storage-disabled/full behavior leaves the in-memory UI usable.
- [ ] The only application storage key after save is `linux-migration-companion:passport:v2`.

## Responsive and accessibility

- [ ] No horizontal page overflow (the narrow side navigation may intentionally scroll).
- [ ] Cards do not overlap, clip controls, truncate critical status, or create kilometer-long lines.
- [ ] Sticky controls do not cover focused elements or the final card.
- [ ] The ten-item desktop navigation remains reachable at short heights.
- [ ] Visible focus follows a logical order; no keyboard trap exists.
- [ ] Button groups, selects, textareas, checkboxes, summaries, and file input trigger have accessible names.
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
- [ ] Export contains no automatically collected device, account, file, network, or browser-history identifier.
- [ ] Production dependency audit reports no high/critical production vulnerability.
- [ ] CSP blocks inline script/object/form submission and no component uses unsafe HTML injection.

## Release and deployment gate

- [ ] `npm ci && npm run qa` passes from a clean checkout.
- [ ] `VITE_BASE_PATH=/linux-migration-companion/ npm run build` succeeds.
- [ ] CI and CodeQL pass on the release-candidate SHA.
- [ ] A branch preview or equivalent serves the exact candidate SHA over HTTPS.
- [ ] Chromium and Firefox matrix above is performed against that SHA.
- [ ] Page title, description, canonical URL, favicon, and app identity are correct.
- [ ] `noindex,nofollow` and `robots.txt` remain in place until Dennis explicitly authorizes public indexing.
- [ ] Only after approval: remove both indexing gates in one reviewed change; do not change them implicitly during deployment.

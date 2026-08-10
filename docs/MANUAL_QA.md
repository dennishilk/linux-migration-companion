# Manual QA checklist

Record browser versions, viewport, commit SHA, date, and any deviation. Do not use real secrets or personal Passports.

## Required browsers and viewports

- Chromium current: 390×844, 768×1024, 1366×768, 1920×1080, 2560×1440.
- Firefox current: 1366×768 and 1920×1080.
- WebKit/Safari current where available: 390×844 and desktop.
- Keyboard-only pass at desktop width.
- `prefers-reduced-motion: reduce` pass.

## Core journey

- [ ] Fresh load shows Alpha, local-only, no-tracking, and no-disk-write boundaries.
- [ ] DE/EN switch changes the current interface and survives reload.
- [ ] All five Advisor groups can be opened; every choice remains selected while navigating.
- [ ] Default persona shows Mint, Zorin, Ubuntu in that order.
- [ ] Beginner + NVIDIA + Steam + low maintenance does not promote CachyOS/Nobara.
- [ ] Experienced AMD critical rolling gamer can surface CachyOS.
- [ ] All 11 profiles can be compared with explanations and no percentages.
- [ ] Software search, category filter, add/remove, important/essential controls work.
- [ ] Essential Photoshop/Creative Cloud produces a blocker and “keep Windows” next step.
- [ ] Manual GPU/evidence/notes stay local and enforce 1,000-character note limit.
- [ ] NVIDIA guidance never hard-codes a driver version.
- [ ] All 10 live-test rows support four states and issue blocks readiness.
- [ ] Media guide uses selected distro’s official links and never offers a raw write action.
- [ ] Passport preview matches stored data; export downloads valid JSON.
- [ ] Valid Passport imports; malformed, extra-field, oversized, and unknown-ID files fail safely.
- [ ] Reset requires confirmation and clears local state.
- [ ] First Boot plan changes for NVIDIA, Steam, native selected apps, unresolved hardware, and NixOS.
- [ ] Explain mode reveals reasons/cautions; no control executes commands or installs anything.

## Responsive and accessibility

- [ ] No horizontal page overflow at required viewports (side navigation may intentionally scroll on narrow screens).
- [ ] Cards do not overlap, truncate critical status, or create unreadably long lines.
- [ ] Visible focus follows logical tab order.
- [ ] Radio/checkbox/select/expandable controls have accessible names.
- [ ] Status is conveyed by text and shape, not colour alone.
- [ ] Browser zoom at 200% preserves the journey.
- [ ] Reduced motion removes smooth scrolling/transition duration.

## Network and privacy

- [ ] DevTools Network shows only same-origin static assets until a user opens an external link.
- [ ] No analytics, font, telemetry, API, or service-worker request occurs.
- [ ] Application storage contains only `linux-migration-companion:passport:v1`.
- [ ] Exported JSON contains no automatically collected device or account identifier.

## Deployment

- [ ] `npm ci && npm run qa` passes from a clean checkout.
- [ ] CI, CodeQL, and Pages workflows complete on the target SHA.
- [ ] Standalone Pages URL returns 200 over HTTPS and loads assets under the repository base path.
- [ ] Page source contains `noindex,nofollow`.
- [ ] Direct reload succeeds.

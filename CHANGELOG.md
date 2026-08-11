# Changelog

## 0.3.0-rc.1 — 2026-08-11

- Added an optional privacy-first Hardware Snapshot workflow while preserving the complete manual evidence path.
- Added a deliberately limited browser report using feature-detected platform, privacy-reduced processor/memory values and WebGPU availability; it exposes no device identities.
- Added readable, dependency-free Windows PowerShell and Linux Python collectors with explicit read allowlists, no network access, no elevation/root request, privacy self-checks and create-new output handling.
- Added strict Hardware Snapshot schema v1 validation with 128 KiB/depth-8 bounds, closed fields/categories, source/collector consistency, prototype/private-key rejection, Unicode controls and inert rendering.
- Integrated detected facts into the existing evidence classes as `known_fact` only. Imports never mark hardware required, pass a live test or claim Linux compatibility; live failures retain blocker behavior.
- Added Passport v3 snapshot provenance plus explicit non-inventing v1→v3 and v2→v3 migrations and the app-owned v3 storage key.
- Updated Start over so confirmed reset also removes snapshot state while preserving locale and unrelated storage.
- Added public snapshot/Passport schemas, field-level collector audit documentation, privacy/security/threat-model updates and an expanded Windows/Linux/browser/manual QA plan.
- Expanded schema, collector, privacy, browser-degradation, evidence, readiness, reset, migration and adversarial persona regression coverage.
- Bumped the release candidate from `0.2.0-rc.1` to `0.3.0-rc.1`; no deployment or indexing change is included.

## 0.2.0-rc.1 — 2026-08-11

- Added restrained Dennis Hilk/MIT attribution to the public UI and README.
- Replaced the former `LM` monogram with an original converging migration-path mark and matching favicon.
- Replaced the immediate Passport reset with a global, localized, keyboard-accessible confirmation dialog that clears only Companion-owned persistence.
- Expanded Software Reality from 60 to 90 curated applications/workflows with explicit scope, volatility, official source, and review date.
- Replaced the single hardware summary with 19 class-level evidence records and seven honest evidence states.
- Added explainable migration readiness and “Should I keep Windows?” strategy derivation without percentages.
- Added three-profile migration comparison and preserved all specialist distro gates.
- Added a 19-category data-migration planner with six action vocabularies and explicit encryption/cloud/database warnings.
- Added Passport v2 with comparison, hardware evidence, and data migration; retained strict v1 import through an explicit non-inventing migration.
- Added First Boot Plan 2.0 with guided and WHAT/WHY/RISK/VERIFY/BACK OUT modes.
- Added query-parameter direct navigation and browser history support for all ten stages.
- Updated responsive layouts, localization, focus/skip navigation, metadata, subpath favicon handling, privacy/security/threat-model/QA documentation, and release gates.
- Expanded automated coverage from 52 baseline tests to more than 100 regression, adversarial, schema, persistence, readiness, and UI tests.
- Fixed shared mutable Passport defaults found during adversarial testing.
- Kept the native hardware scanner, command execution, package installation, raw media writing, partitioning, bootloader changes, analytics, and indexing intentionally disabled.

## 0.1.0-alpha.1 — 2026-08-10

- Added bilingual deterministic Fit Advisor for 11 distro profiles.
- Added 60-workflow software assessment with essential blockers.
- Added manual hardware evidence and 10-step Live Test Assistant.
- Added safe official media handoff and non-executing First Boot plans.
- Added strict local Migration Passport v1 import/export.
- Added responsive accessible UI, 52 tests, CI, CodeQL, Dependabot, Pages deployment, privacy/security/threat-model documentation.
- Explicitly deferred the native Windows hardware scanner.

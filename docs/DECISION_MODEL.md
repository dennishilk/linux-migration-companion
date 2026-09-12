# Decision model

The advisor is deterministic and explainable. The same answers and data version produce the same ordered result.

## Output vocabulary

The user sees one of four ordinal tiers:

1. **Strong fit**
2. **Possible fit — trade-offs**
3. **Exploratory**
4. **Not recommended**

No percentage is displayed because the Companion has no calibrated probability model or population outcome data. Internally, additive points establish ordering, while hard caps enforce suitability boundaries. The score is not a compatibility measurement.

## Evaluation order

1. Start with a small profile-specific prior used only for stable ordering.
2. Apply every relevant answer rule: experience, terminal, troubleshooting, maintenance, freshness, rolling tolerance, desktop, UI familiarity, gaming, office, development, creation, media, professional dependencies, GPU, Secure Boot, system intent, device type, and migration mode.
3. Add bilingual reasons, trade-offs, triggering answers, and change factors at the point each rule fires.
4. Apply specialist gates and maximum tiers.
5. Convert the final ordinal points to a tier, then apply the strictest cap.
6. Sort by tier, then points, then stable profile name.
7. Separately evaluate global warnings, software, hardware, live-test, and data evidence. A blocker can override every distro result.

## Readiness evaluation order

The readiness engine is separate from distro ranking:

1. Essential software records explicitly marked `blockerWhenEssential`, failed required hardware, known required hardware issues, and live-test failures create blockers.
2. Blockers return `BLOCKED`; software blockers recommend keeping Windows for those workflows.
3. Essential medium/high workflows without a hard blocker return `WINDOWS SHOULD BE RETAINED` until representative proof exists.
4. An otherwise empty evidence record returns `INSUFFICIENT EVIDENCE`.
5. Required `UNKNOWN`, `KNOWN FACT` (including snapshot-detected), or `USER REPORTED` hardware and missing essential live tests return `LIVE TEST REQUIRED`.
6. Remaining software, gaming, data, or manual checks return `READY WITH CHECKS`.
7. Only resolved required evidence with no remaining checks returns `READY`.

Each result also exposes one bilingual current gate derived inside the same readiness branch, plus one concrete next action where applicable. It follows the order above, names the first active hard blocker or unresolved required workflow/evidence, and never represents a numeric distance from another state.

The migration strategy then respects the recorded test/dual-boot/replace intent without ever performing a disk or boot action.

Current raw tier boundaries in `recommend.ts` are `>=20` strong, `>=13` possible, `>=7` exploratory, otherwise not recommended. These boundaries are implementation details and require persona-test review when changed.

## Hard invariants

- Gaming alone never unlocks CachyOS and does not make Bazzite an automatic winner.
- CachyOS needs intermediate-or-better experience, comfortable-or-better troubleshooting, active-or-hobby maintenance, critical gaming, and explicit rolling acceptance.
- Nobara needs that specialist gaming context or an experienced professional-media context to rise; beginner/minimal-maintenance use is capped at exploratory.
- Bazzite needs important-or-critical gaming plus a preference compatible with its managed image-based host. Beginner or low-troubleshooting use is capped at exploratory, and manual system-assembly intent conflicts with it.
- Void needs advanced experience, terminal/troubleshooting comfort, active maintenance, and rolling acceptance to rise beyond exploratory; the property-intent answer changes rank but is not a distro-name gate.
- EndeavourOS needs intermediate-or-better experience, terminal/troubleshooting comfort, active maintenance, and rolling acceptance. Its installer-assisted setup can outrank manual Arch when the user wants customization without full assembly.
- NixOS is not recommended without explicit declarative-system intent; insufficient experience can further cap it.
- Arch is not recommended for beginners or users choosing preassembled graphical defaults. Advanced experience, terminal/troubleshooting comfort, active maintenance, and rolling acceptance can make it realistic; absent manual-assembly intent caps it at possible rather than erasing it.
- Gentoo is not recommended unless expert experience, terminal/troubleshooting enthusiasm, hobby maintenance, rolling acceptance, and compile-control intent all align.
- A “no” to rolling release blocks rolling profiles from recommendation tiers regardless of their point total.
- NVIDIA increases the need for a supported driver workflow; it does not imply a gaming/enthusiast distro.
- Essential software with no reliable equivalent becomes a hard software blocker.
- Any recorded live-test issue blocks readiness. Untested essential functions require a live test.
- `KNOWN FACT` and `USER REPORTED` never equal `LIVE VERIFIED`.
- Browser/snapshot detection never changes `required`, never passes a live test, and never asserts Linux compatibility. Only explicit live evidence can produce `LIVE VERIFIED`.
- Reverting a live result returns to a still-present snapshot `KNOWN FACT` rather than erasing provenance or preserving a false pass.
- Required hardware cannot simultaneously be `NOT APPLICABLE`; Passport validation rejects that contradiction.
- Data inventory absence is an open check, not an implicit pass.

## Persona regression set

Tests cover at least:

- beginner + NVIDIA + Steam + low maintenance;
- experienced AMD critical gamer accepting rolling updates;
- low-maintenance office family;
- cross-platform developer wanting a current KDE stack;
- explicit NixOS learner;
- advanced Arch candidate with and without manual-build intent;
- exact Gentoo expert and near-miss persona;
- Void-like and EndeavourOS-like experienced rolling users;
- beginner and advanced users who explicitly reject rolling releases;
- beginner gamer and managed-image Bazzite candidate;
- mainstream Kubuntu/KDE candidate;
- Adobe/Creative Cloud essential blocker;
- Xbox/Vanguard warning/blocker context;
- Secure Boot and NVIDIA policy conflicts.

The test suite also mutates every advisor field and proves that each answer affects a score, explanation, trade-off, or warning in an appropriate context.

## Change policy

A rule change must include:

- the evidence or product rationale;
- before/after outcomes for relevant personas;
- a regression test for each intended movement;
- a check that the specialist and blocker invariants remain true;
- updated DE and EN explanations when user-visible meaning changes.

# Decision model

The advisor is deterministic and explainable. The same answers and data version produce the same ordered result.

## Output vocabulary

The user sees one of four ordinal tiers:

1. **Strong fit**
2. **Possible fit — trade-offs**
3. **Exploratory**
4. **Not recommended**

No percentage is displayed because the Alpha has no calibrated probability model or population outcome data. Internally, additive points establish ordering, while hard caps enforce suitability boundaries. The score is not a compatibility measurement.

## Evaluation order

1. Start with a small profile-specific prior used only for stable ordering.
2. Apply every relevant answer rule: experience, terminal, troubleshooting, maintenance, freshness, rolling tolerance, desktop, UI familiarity, gaming, office, development, creation, media, professional dependencies, GPU, Secure Boot, system intent, device type, and migration mode.
3. Add bilingual reasons, trade-offs, triggering answers, and change factors at the point each rule fires.
4. Apply specialist gates and maximum tiers.
5. Convert the final ordinal points to a tier, then apply the strictest cap.
6. Sort by tier, then points, then stable profile name.
7. Separately evaluate global warnings and the software/live evidence. A blocker can override every distro result.

Current raw tier boundaries in `recommend.ts` are `>=20` strong, `>=13` possible, `>=7` exploratory, otherwise not recommended. These boundaries are implementation details and require persona-test review when changed.

## Hard invariants

- Gaming alone never unlocks CachyOS.
- CachyOS needs intermediate-or-better experience, comfortable-or-better troubleshooting, active-or-hobby maintenance, critical gaming, and explicit rolling acceptance.
- Nobara needs that specialist gaming context or an experienced professional-media context to rise; beginner/minimal-maintenance use is capped at exploratory.
- NixOS is not recommended without explicit declarative-system intent; insufficient experience can further cap it.
- Arch is not recommended without manual-build/compile intent and is capped unless advanced experience, terminal comfort, troubleshooting, and rolling tolerance align.
- Gentoo is not recommended unless expert experience, terminal/troubleshooting enthusiasm, hobby maintenance, rolling acceptance, and compile-control intent all align.
- A “no” to rolling release blocks rolling profiles from recommendation tiers regardless of their point total.
- NVIDIA increases the need for a supported driver workflow; it does not imply a gaming/enthusiast distro.
- Essential software with no reliable equivalent becomes a hard software blocker.
- Any recorded live-test issue blocks readiness. Untested functions keep readiness incomplete.

## Persona regression set

Tests cover at least:

- beginner + NVIDIA + Steam + low maintenance;
- experienced AMD critical gamer accepting rolling updates;
- low-maintenance office family;
- cross-platform developer wanting a current KDE stack;
- explicit NixOS learner;
- explicit Arch builder;
- exact Gentoo expert and near-miss persona;
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

# Threat model

Last reviewed: 2026-08-11

## Assets

- Integrity of recommendation, blocker, readiness, and Windows-retention decisions.
- Confidentiality of software choices, notes, hardware evidence, and migration preferences.
- User control over downloads, removable media, disks, boot configuration, installation, and package management.
- Trust in primary source links and the deployed static bundle.
- Availability of a proven Windows fallback until essential workflows are verified.

## Adversaries and failures

| Threat | Consequence | Release-candidate mitigation | Residual risk |
|---|---|---|---|
| Malicious/oversized Passport | Memory pressure, unexpected state, UI injection | 256 KiB cap before parse, depth-12 cap, strict Zod objects, closed enums, string limits, known-ID validation, React escaping | Browser still parses one bounded JSON string |
| Stale or contradictory Passport | False readiness or hidden unknowns | Only strict v1/v2; explicit v1 migration; required + not-applicable hardware rejected; unique comparison IDs; derived readiness recomputed | Semantically inaccurate user notes cannot be independently verified |
| Prototype/unknown catalog keys | Corrupt assessment or future logic | Unknown software, distro, hardware, and data IDs rejected; imported objects are never prototype-merged | Every future schema migration needs the same review |
| Stored/script injection | Execute attacker content | No `dangerouslySetInnerHTML`; notes render as text; no third-party runtime scripts | Browser extensions/same-origin compromise are outside app control |
| Shared mutable defaults | Evidence leaks across resets/new records | Every Passport receives isolated nested defaults; regression tests mutate independent copies | Future nested fields must preserve this invariant |
| Compromised source link | Misleading or malicious download | Curated HTTPS primary links, visible handoff, per-record review date and volatility label | Vendor/project pages can change after review |
| Stale compatibility assertion | Unsupported workflow shown as stable truth | Application/workflow distinction, stable/volatile flag, manual-verification routes, no Wine/Proton support equivalence | Curated review is not live monitoring |
| Wrong USB target | Data loss | No device enumeration/write; explicit handoff to established writers; unplug-other-drives guidance | External writer and user can still select incorrectly |
| Unsafe installer/partition action | Windows/data loss | No partition/install API; prominent installer boundary; readiness frequently advises keeping Windows | Official installers remain powerful tools |
| Misleading hardware inference | Failed migration | No scanner; seven explicit evidence states; linked live tests; known/user-reported facts remain unresolved | Live tests cannot prove all future kernels/updates |
| False READY result | User removes a proven system too early | Hard blockers evaluated first; failed required hardware/live tests block; absent evidence cannot pass; adversarial readiness tests | The app relies on truthful, representative user input |
| Gaming/specialist bias | Inappropriate specialist distro | Explicit gates and beginner/NVIDIA/Gentoo/NixOS/Arch persona tests | Curated rules remain product judgment, not outcomes data |
| Secret entry into notes | Sensitive export/storage disclosure | Copy repeatedly says no passwords/private keys/recovery codes; bounded local notes; inspect-before-share guidance | Free text cannot safely detect every secret |
| Dependency/supply-chain compromise | Malicious static bundle | Lockfile, CI audit, CodeQL, Dependabot, minimal workflow permissions, reviewable static build | Major action tags and npm ecosystem are not zero-risk |
| Hosting/account compromise | Modified deployment | Repository controls, Actions deployment, public history; deployment only from `main` | Repository owner security is external to code |
| Local device/shared profile access | Passport disclosure | Minimal collection, explicit reset/export, no account/backend | `localStorage` is not encrypted |

## Trust boundaries

1. **Browser UI ↔ local state:** trusted application code, untrusted user text.
2. **JSON file ↔ Passport parser:** fully untrusted until bounded and strictly validated.
3. **Passport evidence ↔ derived decision:** typed input to pure engines; output is explainable but depends on honest evidence.
4. **Application ↔ external site:** user-visible link boundary; no API trust is inherited.
5. **Application ↔ media writer/installer:** guidance ends; external privileged software owns the action.
6. **Source repository ↔ deployed artifact:** CI/build/deployment supply-chain boundary.

## Explicit non-goals

The Companion does not defend a compromised browser, malicious extension, compromised repository/hosting account, modified operating system, malicious official upstream binary, or deliberately false user evidence. It reduces authority and data exposure so those failures have less application-specific leverage.

## Native-scanner gate

Any future scanner changes the model materially. Prerequisites include a field-level privacy allowlist, signed reproducible releases, local-only IPC or file export, network denial, sandboxing where available, no raw storage APIs, no administrator requirement, user preview/redaction, provenance, expiry, and independent review. Until those exist, deferral is the security feature.

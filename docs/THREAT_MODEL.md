# Threat model

Last reviewed: 2026-08-10

## Assets

- Integrity of recommendation and blocker decisions.
- Confidentiality of a user’s software choices, notes, and migration preferences.
- User control over downloads, removable media, disks, boot configuration, installation, and package management.
- Trust in primary source links and the deployed static bundle.

## Adversaries and failures

| Threat | Consequence | Alpha mitigation | Residual risk |
|---|---|---|---|
| Malicious/oversized Passport | Memory pressure, unexpected state, UI injection | 256 KiB cap, depth cap, strict Zod objects, closed enums, string limits, known-ID validation, React escaping | Browser still parses a bounded JSON string |
| Prototype/unknown catalog keys | Corrupt assessment or future logic | Unknown software/distro IDs rejected; imported objects are never merged into prototypes | Schema migration needs equal care |
| Stored/script injection | Execute attacker content | No `dangerouslySetInnerHTML`; notes render as text; no third-party runtime scripts | Browser extensions/same-origin compromise are outside app control |
| Compromised source link | Misleading or malicious download | Curated HTTPS primary links, visible domain handoff, review date, user-controlled navigation | A vendor/project site can change after review |
| Wrong USB target | Data loss | App performs no device enumeration/write and explicitly hands off to established writers; asks user to unplug unrelated drives | The external writer and user can still select incorrectly |
| Unsafe installer/partition action | Windows/data loss | App never partitions/installs; prominent official-installer boundary; blockers advise keeping Windows | Official installers remain powerful tools |
| Misleading hardware inference | Failed migration | Scanner deferred; `UNKNOWN` state; representative live checklist | Live tests cannot prove all future kernels/updates |
| Recommendation gaming bias | Inappropriate specialist distro | Explicit specialist gates and tested beginner-NVIDIA invariant | Curated rules remain product judgment, not outcome statistics |
| Dependency/supply-chain compromise | Malicious static bundle | Lockfile, CI audit, CodeQL, Dependabot, minimal workflow permissions, reviewable build | Major action tags and npm ecosystem are not zero-risk |
| Hosting/account compromise | Modified deployment | GitHub account/repo controls, Actions deployment, public history | Repository owner security is external to code |
| Local device/shared profile access | Passport disclosure | Minimal collection, explicit reset/export, no secrets request | `localStorage` is not encrypted |

## Trust boundaries

1. **Browser UI ↔ local state:** trusted application code, untrusted user text.
2. **JSON file ↔ Passport parser:** fully untrusted until strict validation succeeds.
3. **Application ↔ external site:** user-visible link boundary; no API trust is inherited.
4. **Application ↔ media writer/installer:** guidance ends; external privileged software owns the action.
5. **Source repository ↔ deployed artifact:** CI/build/deployment supply-chain boundary.

## Explicit non-goals

The Alpha does not defend a compromised browser, malicious extension, compromised GitHub account, modified operating system, or malicious official upstream binary. It reduces authority and data exposure so those failures have less application-specific leverage.

## Native-scanner gate

Any future scanner changes the model materially. Required prerequisites include a field-level privacy allowlist, signed reproducible releases, local-only IPC or file export, network denial, sandboxing where available, no raw storage APIs, no admin requirement, user preview/redaction, provenance, expiry, and an external review. Until those exist, deferral is the security feature.

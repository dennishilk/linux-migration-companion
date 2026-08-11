# Threat model

Last reviewed: 2026-08-11

## Assets

- Integrity of recommendation, blocker, readiness, and Windows-retention decisions.
- Confidentiality of software choices, notes, hardware evidence, and migration preferences.
- Confidentiality of locally generated hardware snapshots and the absence of personal/unique identifiers from collector output.
- User control over downloads, removable media, disks, boot configuration, installation, and package management.
- Trust in primary source links and the deployed static bundle.
- Availability of a proven Windows fallback until essential workflows are verified.

## Adversaries and failures

| Threat | Consequence | Release-candidate mitigation | Residual risk |
|---|---|---|---|
| Malicious/oversized Passport | Memory pressure, unexpected state, UI injection | 256 KiB cap before parse, depth-12 cap, strict Zod objects, closed enums, string limits, known-ID validation, React escaping | Browser still parses one bounded JSON string |
| Stale or contradictory Passport | False readiness or hidden unknowns | Strict v1/v2/v3 only; explicit v1/v2→v3 migrations add no snapshot/live evidence; required + not-applicable hardware rejected; derived readiness recomputed | Semantically inaccurate user notes cannot be independently verified |
| Malicious/oversized hardware snapshot | Memory pressure, unexpected state or parser abuse | 128 KiB cap before use, depth-8 cap, strict objects, at most 64 facts, closed enums, bounded text, complete source/collector consistency | Browser still parses one bounded JSON string before structural validation |
| Unexpected/prototype/private object keys | Prototype pollution, PII entry or future logic corruption | Recursive denylist preflight for `__proto__`/constructor/prototype and prohibited private key names; strict nested Zod schemas; no object spreading before validation | A sensitive value hidden inside an allowed free-text device name cannot be recognized reliably |
| Stored HTML/script/device-string injection | Execute attacker content | No `dangerouslySetInnerHTML`; imported device strings/notes render as React text; control characters, overlong strings and malformed surrogates rejected; markup/path-like text never becomes a path, URL or command | Browser extensions/same-origin compromise are outside app control |
| Collector tampering or user-edited snapshot | False provenance/device facts | Full source is the artifact; import validates structure but labels source as a claim, not a signature; facts stay `known_fact`, never compatibility/live proof | No cryptographic authenticity; a user or third party can produce plausible false facts |
| Accidental PII collection | Personal/unique data stored or shared | Explicit property/path allowlists, no raw dumps, prohibited-key self-check in each collector, independent output/schema tests, inspect-before-import guidance | A device model/description can be customized with personal text; user inspection remains necessary |
| Command/PowerShell/shell injection | Execute device text or attacker input | Collectors construct no shell command; Linux uses no subprocess/shell; Windows uses constant WQL strings and never evaluates output; imported fields are data only | Collector source itself can be modified before execution |
| Output path overwrite/symlink | Overwrite or redirect a local file | Windows `CreateNew`; Linux mode 0600 + `O_EXCL` + final-component `O_NOFOLLOW`; no temp file; `.json` suffix; existing output rejected | A user-selected malicious parent directory/junction/symlink/mount can redirect the new file |
| Windows policy/elevation pressure | User weakens security to run collector | No elevation request; Secure Boot deliberately unavailable; UI/docs say never weaken policy and offer browser/manual fallback; no `Bypass` guidance | Default/managed execution policy can make the Windows collector unavailable |
| Browser fingerprinting/overclaim | Expose identity or imply full GPU detection | Only UA-CH platform, coarse processor/memory and WebGPU adapter availability; feature detection; no renderer/features/limits/WebGL/media/WebUSB/HID; zero browser device facts | Even coarse values add some entropy and APIs vary across browsers |
| Shared mutable defaults | Evidence leaks across resets/new records | Every Passport receives isolated nested defaults; regression tests mutate independent copies | Future nested fields must preserve this invariant |
| Compromised source link | Misleading or malicious download | Curated HTTPS primary links, visible handoff, per-record review date and volatility label | Vendor/project pages can change after review |
| Stale compatibility assertion | Unsupported workflow shown as stable truth | Application/workflow distinction, stable/volatile flag, manual-verification routes, no Wine/Proton support equivalence | Curated review is not live monitoring |
| Wrong USB target | Data loss | No device enumeration/write; explicit handoff to established writers; unplug-other-drives guidance | External writer and user can still select incorrectly |
| Unsafe installer/partition action | Windows/data loss | No partition/install API; prominent installer boundary; readiness frequently advises keeping Windows | Official installers remain powerful tools |
| Misleading hardware inference | Failed migration | Detection/provenance stored separately; imports do not alter `required` or live state; seven evidence states; required `known_fact` remains unresolved; failed linked tests block | Live tests cannot prove all future kernels/updates |
| False READY result | User removes a proven system too early | Hard blockers evaluated first; failed required hardware/live tests block; absent evidence cannot pass; adversarial readiness tests | The app relies on truthful, representative user input |
| Gaming/specialist bias | Inappropriate specialist distro | Explicit gates and beginner/NVIDIA/Gentoo/NixOS/Arch persona tests | Curated rules remain product judgment, not outcomes data |
| Secret entry into notes | Sensitive export/storage disclosure | Copy repeatedly says no passwords/private keys/recovery codes; bounded local notes; inspect-before-share guidance | Free text cannot safely detect every secret |
| Dependency/supply-chain compromise | Malicious static bundle | Lockfile, CI audit, CodeQL, Dependabot, minimal workflow permissions, reviewable static build | Major action tags and npm ecosystem are not zero-risk |
| Hosting/account compromise | Modified deployment | Repository controls, Actions deployment, public history; deployment only from `main` | Repository owner security is external to code |
| Local device/shared profile access | Passport disclosure | Minimal collection, explicit reset/export, no account/backend | `localStorage` is not encrypted |

## Trust boundaries

1. **Browser UI ↔ local state:** trusted application code, untrusted user text.
2. **Hardware snapshot file ↔ snapshot parser:** fully untrusted; claimed collector source has no inherited authenticity.
3. **JSON file ↔ Passport parser:** fully untrusted until bounded and strictly validated, including embedded snapshot provenance.
4. **Collector ↔ operating system metadata:** constant read allowlist; unavailable data degrades to unknown; no mutation/network/elevation.
5. **Collector ↔ output path:** one create-new local file; user-selected parent directory is trusted.
6. **Passport evidence ↔ derived decision:** typed input to pure engines; output is explainable but depends on honest evidence.
7. **Application ↔ external site:** user-visible link boundary; no API trust is inherited.
8. **Application ↔ media writer/installer:** guidance ends; external privileged software owns the action.
9. **Source repository ↔ deployed artifact:** CI/build/deployment supply-chain boundary.

## Explicit non-goals

The Companion does not defend a compromised browser, malicious extension, compromised repository/hosting account, modified operating system, malicious official upstream binary, or deliberately false user evidence. It reduces authority and data exposure so those failures have less application-specific leverage.

## Collector review gate

The current collectors satisfy the narrow source-script boundary described above and in [HARDWARE_SNAPSHOT.md](HARDWARE_SNAPSHOT.md). Public launch still requires representative Windows 10/11 and physical Linux manual verification of output accuracy/privacy and browser QA; automated fixture/static tests do not substitute for those runs.

Any signing/update system, native binary, local IPC, automatic launch, background service, privilege request, package installation, raw storage access or network client is deferred. Such a change would require a new consent design, signed reproducible release process, sandboxing/network denial and independent review.

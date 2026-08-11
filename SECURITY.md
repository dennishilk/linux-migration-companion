# Security policy

## Supported versions

`0.2.0-rc.1` is a website release candidate. Until a public version is explicitly tagged, only the latest reviewed commit on `main` is maintained.

## Reporting a vulnerability

Do not publish a vulnerability, malicious Passport, or privacy-sensitive reproduction in a public issue. Prefer GitHub’s **Report a vulnerability** flow on the repository Security tab when available. If private reporting is unavailable, open a minimal issue requesting a private contact channel without including exploit details or personal data.

Include the affected commit, browser/OS, impact, a minimal reproduction, and any suggested mitigation. Do not test against other people’s devices or data.

## Security boundary

The application is intentionally static and unprivileged. It must never:

- execute shell/PowerShell commands or request administrator rights;
- install packages or drivers;
- enumerate device identifiers or files;
- open, partition, format, mount, or write storage devices;
- alter firmware settings or bootloaders;
- collect credentials, licence keys, recovery keys, or secrets;
- silently fetch executable content or submit the Passport to a server.

Any proposal crossing this boundary requires a separate threat model, explicit consent design, signed release process, least-privilege implementation, and an independent security review. It is not an incremental UI feature.

## Defensive controls in the release candidate

- Strict TypeScript and deterministic pure decision functions.
- Zod validation for stored/imported Passport v2 data plus an explicit strict v1 migration path.
- 256 KiB import cap, depth-12 cap, string limits, closed enums, strict objects, known-ID validation, unique comparison IDs, and contradictory-evidence rejection.
- No HTML injection from imported content and no use of `dangerouslySetInnerHTML`.
- External links open with `rel="noreferrer"`.
- No runtime third-party scripts, fonts, analytics, or service worker.
- Production dependency audit in CI, CodeQL scanning, Dependabot, branch-scoped Pages deployment, and minimal workflow permissions.
- Hard operational boundary around installation/media actions.

The complete analysis is in [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

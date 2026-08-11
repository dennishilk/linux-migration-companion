# Security policy

## Supported versions

`0.3.0-rc.2` is a website release candidate. Until a public version is explicitly tagged, only the latest reviewed commit on `main` is maintained.

## Reporting a vulnerability

Do not publish a vulnerability, malicious Passport, or privacy-sensitive reproduction in a public issue. Prefer GitHub’s **Report a vulnerability** flow on the repository Security tab when available. If private reporting is unavailable, open a minimal issue requesting a private contact channel without including exploit details or personal data.

Include the affected commit, browser/OS, impact, a minimal reproduction, and any suggested mitigation. Do not test against other people’s devices or data.

## Security boundary

The web application is intentionally static and unprivileged. It must never:

- execute shell/PowerShell commands or request administrator/root rights;
- install packages or drivers;
- automatically enumerate PCI/USB devices, firmware, accounts or user files;
- open, partition, format, mount, or write storage devices;
- alter firmware settings or bootloaders;
- collect credentials, licence keys, recovery keys, or secrets;
- silently fetch executable content or submit the Passport to a server.

The optional downloadable collectors run only after the user independently downloads, inspects and starts them outside the web application. Their narrower boundary is fixed: explicit read allowlists, no elevation/root, no installer/service/registry/package/driver/configuration change, no user-file access, no network, no telemetry/update mechanism, one create-new JSON output, and no execution of collected data. The primary Windows executable implements this directly through local WMI/Win32 APIs rather than wrapping PowerShell. Crossing that boundary requires a new threat model and independent review.

## Defensive controls in the release candidate

- Strict TypeScript and deterministic pure decision functions.
- Zod validation for stored/imported Passport v3 data plus explicit strict v1→v3 and v2→v3 migration paths that add no snapshot/live evidence.
- 256 KiB import cap, depth-12 cap, string limits, closed enums, strict objects, known-ID validation, unique comparison IDs, and contradictory-evidence rejection.
- Separate Hardware Snapshot v1 validation with a 128 KiB cap, depth-8 cap, at most 64 facts, strict source/collector pairing, closed fact categories, bounded/control-free strings, paired non-unique IDs, and rejection of prototype/private key names.
- No HTML injection from imported content and no use of `dangerouslySetInnerHTML`.
- Imported fields are data only and never become a URL, file operation, HTML fragment, shell argument or PowerShell command.
- Collector-side prohibited-key self-checks plus tests that execute Linux output validation and build/run the Windows C# core on a Windows runner, including schema shape, privacy allowlists, multiple devices/VMs, output failures, Unicode/length bounds and ordinary-user manifest checks.
- Linux output uses mode `0600`, `O_EXCL` and `O_NOFOLLOW` where available; Windows uses the OS-resolved Downloads known folder, `FileMode.CreateNew`, exclusive sharing, no temp file and fixed names. Parent redirection remains a documented trust boundary.
- No subprocess or network API in the primary Windows collector; constant WMI queries never include collected text. The only shell handoff opens the already resolved output folder after an explicit button press.
- Deterministic Windows build settings, per-artifact SHA-256 and build provenance. The current RC executable is explicitly unsigned; Authenticode signing and real Windows 10/11 trust-UX QA are required before public release.
- External links open with `rel="noreferrer"`.
- No runtime third-party scripts, fonts, analytics, or service worker.
- Production dependency audit in CI, JavaScript/TypeScript and C# CodeQL scanning, Dependabot, branch-scoped Pages deployment, and minimal workflow permissions.
- Hard operational boundary around installation/media actions.

The complete analysis is in [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).
The field-level implementation audit is in [docs/HARDWARE_SNAPSHOT.md](docs/HARDWARE_SNAPSHOT.md).
The executable release and signing gate is in [docs/WINDOWS_COLLECTOR_RELEASE.md](docs/WINDOWS_COLLECTOR_RELEASE.md).

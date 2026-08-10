# Contributing

Thanks for helping make migration guidance safer and more honest.

## Before opening a change

1. Keep the application static, local-first, bilingual (DE/EN), and non-destructive.
2. Use primary vendor/project documentation for compatibility claims.
3. Express uncertainty as `UNKNOWN` or a verification task; do not invent percentages.
4. Add or update persona/regression tests when decision logic changes.
5. Record a review date when software or distro data changes.
6. Do not add telemetry, remote fonts/scripts, privileged execution, raw-device access, automatic hardware enumeration, or silent uploads.

## Development

```bash
npm ci
npm run dev
npm run qa
```

Use focused commits. Explain user-visible decision changes in the pull request, including which personas move, why, and which hard gates remain. A rule change that only “feels right” without evidence and tests is not ready.

## Data changes

Link a primary source, distinguish native support from web/community compatibility, and describe the representative workflow a user should test. See [docs/DATA_MAINTENANCE.md](docs/DATA_MAINTENANCE.md).

## Accessibility and language

Controls must retain keyboard access, visible focus, semantic labels, and non-colour status cues. New user-facing copy needs natural German and English—not placeholder machine translation.

## Security

Follow [SECURITY.md](SECURITY.md) for vulnerabilities. Never attach real Passports, serial numbers, secrets, or personal files to public issues.

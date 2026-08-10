# Supported distribution profiles

Data review date: 2026-08-10

The Alpha compares a fixed, opinionated set of 11 profiles. This is a decision aid, not a universal ranking or compatibility certification.

## Support-depth vocabulary

- **Guided:** the Alpha provides a structured recommendation, official download/verification/installation handoff, and common migration context.
- **Reference:** the profile participates fully in the advisor, but the intended user is expected to use project documentation and own more troubleshooting.
- **Experimental:** the decision model and boundary guidance exist, but the Alpha does not generate or manage the system’s configuration.

| Profile | Model | Depth | Official project | Alpha-specific boundary |
|---|---|---|---|---|
| Linux Mint 22.3 Cinnamon | LTS | Guided | [linuxmint.com](https://linuxmint.com/) | Familiar/low-maintenance route; hardware still requires live test |
| Zorin OS 18.1 Core | LTS | Guided | [zorin.com/os](https://zorin.com/os/) | Core is sufficient; no Pro upsell in recommendation logic |
| Ubuntu 26.04 LTS | LTS | Guided | [ubuntu.com/desktop](https://ubuntu.com/desktop) | Broad reference; GNOME/Snap choices are disclosed |
| Fedora KDE 44 | Rapid | Guided | [fedoraproject.org/kde](https://fedoraproject.org/kde/) | Current stack; regular upgrades and third-party choices |
| Debian 13 KDE Live | Stable | Guided | [debian.org](https://www.debian.org/) | Stable does not automatically mean beginner-oriented |
| openSUSE Tumbleweed KDE | Rolling | Guided | [get.opensuse.org/tumbleweed](https://get.opensuse.org/tumbleweed/) | Requires explicit rolling tolerance |
| CachyOS Desktop | Rolling | Reference | [cachyos.org](https://cachyos.org/) | Gaming alone never unlocks it; specialist gate applies |
| Nobara Linux | Rapid/project-specific | Reference | [nobaraproject.org](https://nobaraproject.org/) | Specialist gaming/creation context; not equivalent to Fedora support |
| NixOS 26.05 | Stable | Experimental | [nixos.org](https://nixos.org/) | Requires declarative intent; no generated Nix/hardware/disk/secrets config |
| Arch Linux | Rolling | Reference | [archlinux.org](https://archlinux.org/) | Requires manual-build intent and competence gate |
| Gentoo Linux | Rolling/source-based | Reference | [gentoo.org](https://www.gentoo.org/) | Complete expert/compile-control gate |

Edition labels are a reviewed snapshot, not an automatic “latest version” feed. Before downloading, verify the current release and support status on the official project page linked by the application.

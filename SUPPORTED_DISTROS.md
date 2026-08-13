# Supported distribution profiles

Latest data review: 2026-08-13 (each profile retains its own review date in source)

The post-release advisor branch compares a fixed, opinionated set of 16 profiles while keeping the public package version at `0.3.0`. This is a decision aid, not a universal ranking or compatibility certification.

## Support-depth vocabulary

- **Guided:** the Companion provides a structured recommendation, official download/verification/installation handoff, and common migration context.
- **Reference:** the profile participates fully in the advisor, but the intended user is expected to use project documentation and own more troubleshooting.
- **Experimental:** the decision model and boundary guidance exist, but the Companion does not generate or manage the system’s configuration.

| Profile | Category | Model | Depth | Official project | Companion-specific boundary |
|---|---|---|---|---|---|
| Linux Mint 22.3 Cinnamon | Mainstream | LTS | Guided | [linuxmint.com](https://linuxmint.com/) | Familiar/low-maintenance route; hardware still requires live test |
| Zorin OS 18.1 Core | Mainstream | LTS | Guided | [zorin.com/os](https://zorin.com/os/) | Core is sufficient; no Pro upsell in recommendation logic |
| Ubuntu 26.04 LTS | Mainstream | LTS | Guided | [ubuntu.com/desktop](https://ubuntu.com/desktop) | Broad reference; GNOME/Snap choices are disclosed |
| Kubuntu 26.04 LTS | Mainstream | LTS | Guided | [kubuntu.org](https://kubuntu.org/) | Ubuntu lifecycle plus KDE Plasma; not a duplicate GNOME profile |
| Pop!_OS 24.04 LTS | Mainstream | LTS | Guided | [system76.com/pop](https://system76.com/pop/) | COSMIC and hardware-image choices; Secure Boot requirement conflicts with current install guidance |
| Fedora KDE 44 | Mainstream | Rapid | Guided | [fedoraproject.org/kde](https://fedoraproject.org/kde/) | Current stack; regular upgrades and third-party choices |
| Debian 13 KDE Live | Mainstream | Stable | Guided | [debian.org](https://www.debian.org/) | Stable does not automatically mean beginner-oriented |
| openSUSE Tumbleweed KDE | Mainstream | Rolling | Guided | [get.opensuse.org/tumbleweed](https://get.opensuse.org/tumbleweed/) | Requires explicit rolling tolerance |
| CachyOS Desktop | Gaming | Rolling | Reference | [cachyos.org](https://cachyos.org/) | Gaming alone never unlocks it; full specialist gate applies |
| Nobara Linux | Gaming | Rapid/project-specific | Reference | [nobaraproject.org](https://nobaraproject.org/) | Specialist gaming/creation context; not equivalent to Fedora support |
| Bazzite Fedora 44 stable image | Gaming | Rapid/image-based | Reference | [bazzite.gg](https://bazzite.gg/) | Gaming plus a compatible managed-image preference; conventional host ownership conflicts |
| Void Linux 2025-02-02 XFCE image | Advanced | Rolling | Reference | [voidlinux.org](https://voidlinux.org/) | Independent XBPS/runit model; advanced rolling competence required |
| EndeavourOS Titan Neo | Advanced | Rolling | Reference | [endeavouros.com](https://endeavouros.com/) | Installer assists setup but does not remove Arch-style rolling ownership |
| NixOS 26.05 | Advanced | Stable | Experimental | [nixos.org](https://nixos.org/) | Requires declarative intent; no generated Nix/hardware/disk/secrets config |
| Arch Linux | Advanced | Rolling | Reference | [archlinux.org](https://archlinux.org/) | Competence and active rolling ownership are required; manual-build intent strengthens rather than solely unlocks it |
| Gentoo Linux | Expert | Rolling/source-based | Reference | [gentoo.org](https://www.gentoo.org/) | Complete expert/compile-control gate |

Edition labels are a reviewed snapshot, not an automatic “latest version” feed. Before downloading, verify the current release and support status on the official project page linked by the application. The five-profile source record is in [docs/ADVISOR_CATALOG_0.3.1_RESEARCH.md](docs/ADVISOR_CATALOG_0.3.1_RESEARCH.md).

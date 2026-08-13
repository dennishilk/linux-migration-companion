# Advisor catalog 0.3.1 research record

Reviewed: 2026-08-13

This record documents the five profiles added in the focused post-release advisor pass. It uses first-party project pages and describes a reviewed snapshot, not an automatic latest-release feed or compatibility certification.

## Profile matrix

| Project | Verified edition | Release model | Category | Depth | Maintenance expectation | Distinguishing characteristic |
|---|---|---|---|---|---|---|
| Void Linux | 2025-02-02 XFCE image | Rolling | Advanced | Reference | Active rolling updates, project-news review, terminal troubleshooting | Independent; XBPS and runit; official glibc and musl image variants |
| Pop!_OS | 24.04 LTS | LTS | Mainstream | Guided | Low to moderate; LTS base with current COSMIC/kernel/hardware enablement | Ubuntu-based graphical desktop with COSMIC Epoch 1 and separate graphics image choices |
| Bazzite | Fedora 44 stable image | Rapid/image-based | Gaming | Reference | Managed image updates and rollback deployments; the Atomic application/package model must fit | Fedora Atomic/Universal Blue image with hardware/desktop variants and gaming configuration |
| EndeavourOS | Titan Neo (2026.04.27) | Rolling | Advanced | Reference | Active full-system updates, project/Arch news review, and troubleshooting | Installer-assisted, terminal-centric Arch-based system |
| Kubuntu | 26.04 LTS | LTS | Mainstream | Guided | Low to moderate; LTS updates and periodic release upgrades | Ubuntu 26.04 base with KDE Plasma 6; supported through April 2029 |

## Official source handoff

| Project | Home | Download | Verification | Installation |
|---|---|---|---|---|
| Void Linux | [voidlinux.org](https://voidlinux.org/) | [official images](https://voidlinux.org/download/) | [installation media verification](https://docs.voidlinux.org/installation/) | [Void Handbook installation](https://docs.voidlinux.org/installation/) |
| Pop!_OS | [System76 Pop!_OS](https://system76.com/pop/) | [download and checksums](https://system76.com/pop/download/) | [published SHA256 values](https://system76.com/pop/download/) | [System76 installation guide](https://support.system76.com/support/articles/install-pop) |
| Bazzite | [bazzite.gg](https://bazzite.gg/) | [official image picker](https://bazzite.gg/) | [installation guide and SHA256 check](https://docs.bazzite.gg/General/Installation_Guide/install-guide/) | [Bazzite installation guide](https://docs.bazzite.gg/General/Installation_Guide/install-guide/) |
| EndeavourOS | [endeavouros.com](https://endeavouros.com/) | [official download links](https://endeavouros.com/) | [signature/key verification](https://discovery.endeavouros.com/signature-and-keyring/how-to-check-and-trust-key-and-signature-for-the-endeavouros-iso/2025/01/) | [installation documentation](https://discovery.endeavouros.com/installation/) |
| Kubuntu | [kubuntu.org](https://kubuntu.org/) | [Kubuntu download](https://kubuntu.org/download/) | [26.04 image, SHA256SUMS and signature](https://cdimage.ubuntu.com/kubuntu/releases/26.04/release/) | [current official download/install handoff](https://kubuntu.org/download/) |

## Source decisions and boundaries

- Void's official site and handbook establish its independent rolling model, XBPS/runit identity and glibc/musl images. The handbook separately warns that proprietary NVIDIA drivers do not support musl; the app therefore explains the variant constraint without claiming hardware compatibility.
- System76's [download page](https://system76.com/pop/download/), [24.04 release letter](https://blog.system76.com/blog/post/pop-os-letter-from-our-founder) and support pages establish Pop!_OS 24.04 LTS, COSMIC Epoch 1, image/checksum choices, graphical installation and the current requirement to disable Secure Boot. The advisor treats a user requirement to keep Secure Boot enabled as a real conflict.
- Bazzite's site, [official repository releases](https://github.com/ublue-os/bazzite/releases), installation guide, [update/rollback documentation](https://docs.bazzite.gg/Installing_and_Managing_Software/Updates_Rollbacks_and_Rebasing/) and [rpm-ostree guidance](https://docs.bazzite.gg/Installing_and_Managing_Software/rpm-ostree/) establish the current Fedora image line, image picker, Fedora Atomic/Universal Blue model, deployments/rollback and package-layering boundary. Gaming alone remains insufficient.
- EndeavourOS's official site, [Titan Neo release announcement](https://endeavouros.com/news/titan-neo-with-some-fixes-and-upstream-updates-is-available/), Discovery installation/signature pages and [pacman guidance](https://discovery.endeavouros.com/pacman/pacman-basic-commands/) establish the edition, Arch base, installer-assisted setup and rolling maintenance expectations. The installer is not presented as beginner protection.
- Kubuntu's [26.04 release notes](https://www.kubuntu.org/news/kubuntu-26-04-release-notes/) and official image pages establish 26.04 LTS, Plasma 6 and support through April 2029. The older community installation-guide link is visibly marked outdated, so the catalog uses the maintained official download page as the installation handoff instead of presenting obsolete instructions as current.

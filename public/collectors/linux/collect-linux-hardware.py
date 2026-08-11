#!/usr/bin/env python3
"""Linux Migration Companion read-only Linux hardware snapshot collector.

Uses only Python's standard library and selected /proc and /sys interfaces.
It never invokes a shell, installs packages, requests root, accesses user files,
or contacts a network. Its only write is one new JSON output file unless
--stdout is selected.
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

VERSION = "1.0.0"
MAX_FACTS = 64
PROHIBITED_KEYS = {
    "username", "realname", "hostname", "computername", "accountname",
    "email", "emailaddress", "ipaddress", "macaddress", "ssid",
    "wifipassword", "networkhistory", "serial", "serialnumber",
    "systemserialnumber", "motherboardserialnumber", "diskserialnumber",
    "productkey", "activationid", "machineguid", "tpmendorsementidentifier",
    "browserhistory", "filename", "filenames", "directorylisting",
    "userfilecontents", "shellhistory", "environmentsecret", "token",
    "credentials", "sshkey", "sshkeys", "cloudaccount",
}
UNSAFE_KEYS = {"__proto__", "prototype", "constructor"}
ALLOWED_CATEGORIES = {
    "cpu", "graphics", "wifi", "ethernet", "bluetooth", "audio",
    "usb_audio", "webcam", "printer", "scanner", "storage",
    "usb_controller", "input_device", "special_usb",
}


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def safe_text(value: Any, maximum: int) -> str | None:
    if value is None:
        return None
    text = re.sub(r"[\x00-\x1f\x7f]", " ", str(value)).strip()
    if not text:
        return None
    return text[:maximum]


def read_raw_text(path: Path, maximum: int = 4096) -> str | None:
    try:
        with path.open("r", encoding="utf-8", errors="replace") as handle:
            return handle.read(maximum)
    except (OSError, ValueError):
        return None


def read_text(path: Path, maximum: int = 4096) -> str | None:
    return safe_text(read_raw_text(path, maximum), maximum)


def read_hex_id(path: Path) -> str | None:
    value = read_text(path, 16)
    if value is None:
        return None
    match = re.fullmatch(r"(?:0x)?([0-9a-fA-F]{4})", value)
    return match.group(1).lower() if match else None


def assert_privacy_keys(value: Any) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in UNSAFE_KEYS or normalize_key(key) in PROHIBITED_KEYS:
                raise RuntimeError(f"privacy self-check rejected output key: {key}")
            assert_privacy_keys(child)
    elif isinstance(value, list):
        for child in value:
            assert_privacy_keys(child)


def architecture_name(value: str) -> str:
    lowered = value.lower()
    if lowered in {"x86_64", "amd64"}:
        return "x86_64"
    if lowered in {"i386", "i486", "i586", "i686", "x86"}:
        return "x86"
    if lowered in {"aarch64", "arm64"}:
        return "arm64"
    if lowered.startswith("arm"):
        return "arm"
    return "other" if lowered else "unknown"


def os_label() -> str | None:
    content = read_raw_text(Path("/etc/os-release"), 8192)
    if content is None:
        return None
    for line in content.splitlines():
        if not line.startswith("PRETTY_NAME="):
            continue
        value = line.split("=", 1)[1].strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        return safe_text(value.replace(r"\"", '"').replace(r"\\", "\\"), 120)
    return None


def form_factor() -> str:
    chassis = read_text(Path("/sys/class/dmi/id/chassis_type"), 8)
    try:
        code = int(chassis or "")
    except ValueError:
        code = -1
    if code in {8, 9, 10, 11, 14, 30, 31, 32}:
        return "laptop"
    if code in {3, 4, 5, 6, 7, 15, 16, 17, 23, 24, 33, 35, 36}:
        return "desktop"
    if code in {28, 29}:
        return "tablet"
    return "unknown"


def cpu_details() -> tuple[str | None, str | None, str]:
    content = read_raw_text(Path("/proc/cpuinfo"), 128 * 1024) or ""
    model = None
    vendor = None
    flags = ""
    for line in content.splitlines():
        if ":" not in line:
            continue
        key, value = (part.strip() for part in line.split(":", 1))
        if model is None and key in {"model name", "Processor", "Hardware"}:
            model = safe_text(value, 160)
        elif vendor is None and key in {"vendor_id", "CPU implementer"}:
            vendor = safe_text(value, 100)
        elif not flags and key in {"flags", "Features"}:
            flags = value
    virtualization = "supported" if re.search(r"(?:^|\s)(vmx|svm)(?:\s|$)", flags) else "unknown"
    return model, vendor, virtualization


def memory_gib() -> float | None:
    content = read_raw_text(Path("/proc/meminfo"), 16384) or ""
    match = re.search(r"^MemTotal:\s+(\d+)\s+kB$", content, re.MULTILINE)
    if not match:
        return None
    return round(int(match.group(1)) / 1024 / 1024, 2)


def secure_boot_state() -> tuple[str, str]:
    efi_root = Path("/sys/firmware/efi")
    if not efi_root.is_dir():
        return "unknown", "unavailable"
    secure_files = sorted((efi_root / "efivars").glob("SecureBoot-*"))
    for path in secure_files:
        try:
            with path.open("rb") as handle:
                value = handle.read(5)
            if len(value) >= 5:
                return "uefi", "enabled" if value[4] == 1 else "disabled"
        except OSError:
            continue
    return "uefi", "unavailable"


def parent_hardware_ids(path: Path) -> tuple[str | None, str | None, str | None]:
    current = path
    for _ in range(8):
        pci_vendor = read_hex_id(current / "vendor")
        pci_device = read_hex_id(current / "device")
        if pci_vendor and pci_device:
            return pci_vendor, pci_device, "pci"
        usb_vendor = read_hex_id(current / "idVendor")
        usb_device = read_hex_id(current / "idProduct")
        if usb_vendor and usb_device:
            return usb_vendor, usb_device, "usb"
        if current.parent == current:
            break
        current = current.parent
    return None, None, None


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a privacy-minimized read-only hardware snapshot.")
    parser.add_argument("--output", help="New .json output path; existing files are never overwritten.")
    parser.add_argument("--stdout", action="store_true", help="Print JSON instead of writing a file.")
    args = parser.parse_args()
    if args.stdout and args.output:
        parser.error("--stdout and --output cannot be combined")

    facts: list[dict[str, Any]] = []
    fact_keys: set[tuple[Any, ...]] = set()

    def add_fact(
        category: str,
        name: Any,
        vendor: Any = None,
        bus: str | None = None,
        vendor_id: str | None = None,
        device_id: str | None = None,
    ) -> None:
        if category not in ALLOWED_CATEGORIES or len(facts) >= MAX_FACTS:
            return
        clean_name = safe_text(name, 160)
        clean_vendor = safe_text(vendor, 100)
        if clean_name is None:
            return
        if bool(vendor_id) != bool(device_id):
            vendor_id = device_id = None
        key = (category, clean_name, clean_vendor, bus, vendor_id, device_id)
        if key in fact_keys:
            return
        fact_keys.add(key)
        fact: dict[str, Any] = {"category": category, "name": clean_name}
        if clean_vendor:
            fact["vendor"] = clean_vendor
        if bus in {"pci", "usb", "platform", "unknown"}:
            fact["bus"] = bus
        if vendor_id and device_id:
            fact["vendorId"] = vendor_id
            fact["deviceId"] = device_id
        facts.append(fact)

    cpu_model, cpu_vendor, virtualization = cpu_details()
    if cpu_model:
        add_fact("cpu", cpu_model, cpu_vendor, "platform")

    pci_root = Path("/sys/bus/pci/devices")
    if pci_root.is_dir():
        for device_path in sorted(pci_root.iterdir()):
            class_value = read_text(device_path / "class", 16) or ""
            match = re.fullmatch(r"0x([0-9a-fA-F]{6})", class_value)
            vendor_id = read_hex_id(device_path / "vendor")
            device_id = read_hex_id(device_path / "device")
            if not match or not vendor_id or not device_id:
                continue
            base_class = match.group(1)[:2].lower()
            subclass = match.group(1)[2:4].lower()
            category = None
            if base_class == "03":
                category = "graphics"
            elif base_class == "04":
                category = "audio"
            elif base_class == "01":
                category = "storage"
            elif base_class == "0c" and subclass == "03":
                category = "usb_controller"
            if category:
                add_fact(category, f"PCI {vendor_id}:{device_id}", bus="pci", vendor_id=vendor_id, device_id=device_id)

    network_root = Path("/sys/class/net")
    if network_root.is_dir():
        for interface in sorted(network_root.iterdir()):
            if interface.name == "lo":
                continue
            if (interface / "wireless").is_dir():
                category = "wifi"
            elif read_text(interface / "type", 16) == "1":
                category = "ethernet"
            else:
                continue
            try:
                resolved = (interface / "device").resolve(strict=True)
            except OSError:
                resolved = interface
            vendor_id, device_id, bus = parent_hardware_ids(resolved)
            if vendor_id and device_id:
                add_fact(
                    category,
                    f"{(bus or 'network').upper()} {vendor_id}:{device_id}",
                    bus=bus,
                    vendor_id=vendor_id,
                    device_id=device_id,
                )

    bluetooth_root = Path("/sys/class/bluetooth")
    if bluetooth_root.is_dir():
        for controller in sorted(bluetooth_root.iterdir()):
            try:
                resolved = (controller / "device").resolve(strict=True)
            except OSError:
                resolved = controller
            vendor_id, device_id, bus = parent_hardware_ids(resolved)
            if vendor_id and device_id:
                add_fact(
                    "bluetooth",
                    f"{(bus or 'bluetooth').upper()} {vendor_id}:{device_id}",
                    bus=bus,
                    vendor_id=vendor_id,
                    device_id=device_id,
                )

    block_root = Path("/sys/block")
    if block_root.is_dir():
        for block in sorted(block_root.iterdir()):
            if re.match(r"^(loop|ram|zram|dm-|md)", block.name):
                continue
            model = read_text(block / "device/model", 120)
            rotational = read_text(block / "queue/rotational", 4)
            kind = "HDD" if rotational == "1" else "SSD/NVMe" if rotational == "0" else "UNKNOWN"
            size_sectors = read_text(block / "size", 32)
            size_label = ""
            if size_sectors and size_sectors.isdigit():
                size_label = f", {round(int(size_sectors) * 512 / 1024**3, 1)} GiB"
            try:
                resolved_block = str(block.resolve(strict=True))
            except OSError:
                resolved_block = ""
            bus = "pci" if "pci" in resolved_block else "usb" if "usb" in resolved_block else "unknown"
            name = f"{model} ({kind}{size_label})" if model else f"{kind}{size_label}"
            add_fact("storage", name, bus=bus)

    usb_root = Path("/sys/bus/usb/devices")
    if usb_root.is_dir():
        interface_map = {
            "01": "usb_audio",
            "03": "input_device",
            "06": "special_usb",
            "07": "printer",
            "0e": "webcam",
            "ff": "special_usb",
        }
        for device in sorted(usb_root.iterdir()):
            vendor_id = read_hex_id(device / "idVendor")
            device_id = read_hex_id(device / "idProduct")
            if not vendor_id or not device_id:
                continue
            classes: set[str] = set()
            for interface in device.parent.glob(f"{device.name}:*"):
                interface_class = read_text(interface / "bInterfaceClass", 4)
                if interface_class in interface_map:
                    classes.add(interface_map[interface_class])
                elif (
                    interface_class == "e0"
                    and read_text(interface / "bInterfaceSubClass", 4) == "01"
                    and read_text(interface / "bInterfaceProtocol", 4) == "01"
                ):
                    classes.add("bluetooth")
            for category in sorted(classes):
                add_fact(category, f"USB {vendor_id}:{device_id}", bus="usb", vendor_id=vendor_id, device_id=device_id)

    connected_displays = 0
    drm_root = Path("/sys/class/drm")
    if drm_root.is_dir():
        for connector in drm_root.glob("card*-*"):
            if read_text(connector / "status", 16) == "connected":
                connected_displays += 1

    firmware, secure_boot = secure_boot_state()
    system: dict[str, Any] = {
        "osFamily": "linux",
        "architecture": architecture_name(platform.machine()),
        "formFactor": form_factor(),
        "firmware": firmware,
        "secureBoot": secure_boot,
        "virtualization": virtualization,
    }
    label = os_label()
    if label:
        system["osLabel"] = label
    processors = os.cpu_count()
    if processors and 1 <= processors <= 4096:
        system["logicalProcessors"] = processors
    memory = memory_gib()
    if memory and 0.25 <= memory <= 16384:
        system["memoryGiB"] = memory
    system["connectedDisplays"] = min(connected_displays, 64)

    snapshot = {
        "schemaVersion": 1,
        "product": "linux-migration-companion-hardware-snapshot",
        "createdAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "source": "linux_collector",
        "collector": {"id": "linux-python", "version": VERSION},
        "system": system,
        "facts": facts,
    }
    assert_privacy_keys(snapshot)
    payload = json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n"

    if args.stdout:
        sys.stdout.write(payload)
        return 0

    output = Path(args.output) if args.output else Path.cwd() / f"linux-migration-hardware-snapshot-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    # Make the path absolute without resolving its final symlink. O_NOFOLLOW
    # can therefore reject a pre-existing symlink at the output filename.
    output = Path(os.path.abspath(output.expanduser()))
    if output.suffix.lower() != ".json":
        raise SystemExit("Output path must end in .json")
    if not output.parent.is_dir():
        raise SystemExit("Output directory does not exist")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(output, flags, 0o600)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(payload)
    except Exception:
        try:
            os.close(descriptor)
        except OSError:
            pass
        raise
    print(f"Hardware snapshot written to: {output}")
    print("Inspect the JSON before importing it. Detection is not Linux compatibility.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

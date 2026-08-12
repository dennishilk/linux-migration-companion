# Windows executable collector: build, trust and release plan

Last reviewed: 2026-08-12

## Release status

`LinuxMigrationCompanion-HardwareSnapshot.exe` in version `0.3.0` is **not Authenticode-signed**. The website says this before download. Windows may show Microsoft Defender SmartScreen or a low-reputation warning. The project never tells a user to disable Defender, SmartScreen, execution policy or an organization policy, and it does not present an unsigned warning as routine to click through.

Version `0.3.0` publishes this reviewed executable with the unsigned status explicitly accepted and disclosed. Windows cannot cryptographically identify Dennis Hilk as its publisher; the published SHA-256 detects different bytes but does not establish publisher identity. Users who do not accept that limitation should use the complete manual or limited browser evidence path instead.

## Why C# and .NET Framework 4.8

The collector is a small managed Windows executable written in C# 7.3 with WinForms. It targets .NET Framework 4.8 and has no NuGet or third-party runtime dependency. Microsoft documents that .NET Framework 4.8 is included in Windows 10 22H2 and that Windows 11 includes 4.8 or 4.8.1. This makes a framework-dependent executable smaller and easier to audit than bundling a modern self-contained .NET runtime while requiring no developer tooling or separate package install on those target systems.

Primary references:

- [Microsoft: install .NET Framework on Windows and Windows Server](https://learn.microsoft.com/en-us/dotnet/framework/install/on-windows-and-server)
- [Microsoft: `ManagementObjectSearcher`](https://learn.microsoft.com/en-us/dotnet/api/system.management.managementobjectsearcher?view=netframework-4.8)
- [Microsoft: `GetFirmwareType`](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfirmwaretype)
- [Microsoft: known folder identifiers](https://learn.microsoft.com/en-us/windows/win32/shell/knownfolderid)

The executable is one AnyCPU PE file containing managed IL. It is not an installer, service, background task, self-updater or PowerShell wrapper. Hardware logic is implemented directly with fixed local WMI queries and Win32 calls. The source is in [`collectors/windows-exe`](../collectors/windows-exe).

## Runtime and authority

- Target: Windows 10 22H2 and Windows 11 on supported .NET Framework platforms. The artifact is AnyCPU managed IL; ARM64 has not been separately validated on real hardware.
- Runtime: .NET Framework 4.8 or later in the in-place .NET Framework 4 family.
- Manifest: `requestedExecutionLevel="asInvoker"`, `uiAccess="false"`.
- Administrator rights: not requested and not required for the normal path.
- Distribution: one portable `.exe`; no installer and no adjacent application DLL.
- Network: no networking assembly/API, endpoint, telemetry, account, update channel or backend.

Windows 10 22H2 reached ordinary consumer end of support on 2025-10-14. Collector compatibility does not make an unsupported operating system safe; users should follow Microsoft's applicable support or ESU guidance.

## Direct collection boundary

The executable uses `System.Management` against the local `\\.\root\cimv2` and `\\.\root\StandardCimv2` namespaces with constant `SELECT` property lists. It uses `GetFirmwareType` for UEFI/legacy classification and `SHGetKnownFolderPath(FOLDERID_Downloads)` for the destination. Secure Boot is `unavailable` because the collector does not elevate.

It does not spawn `cmd`, PowerShell, WMI command-line tools or any other process to obtain facts. The optional **Open folder** button passes only the already resolved output directory to `ShellExecuteW`; it never passes device text, imported data or a command line.

Exact selected and discarded WMI properties are documented in [Hardware Snapshot design and collector audit](HARDWARE_SNAPSHOT.md).

## Output behavior

The default destination is the Windows Downloads known folder. If Windows cannot return a usable Downloads path, the executable falls back to the current user's Desktop and then Documents known folders. The success screen displays the exact generated path.

The filename is:

```text
linux-migration-hardware-snapshot-YYYYMMDD-HHMMSS.json
```

`FileMode.CreateNew` and exclusive sharing prevent overwrite. A same-second collision receives `-2`, `-3`, and so on. The collector creates no temporary file and deletes only a partial file that it created itself if its own write fails. It does not create missing directories. A Downloads folder redirected by Windows, OneDrive, a junction or another reparse mechanism remains the operating-system-selected destination; the collector does not attempt to escape or reinterpret that path.

## String and JSON safety

Only closed schema fields are serialized. Hardware/provider strings are treated as untrusted data: control characters are replaced, malformed UTF-16 surrogate sequences are replaced, names/vendors are capped at 160/100 UTF-16 code units, duplicate facts are removed and the total is capped at 64. The built-in JSON serializer performs escaping. A recursive prohibited-key self-check runs before every write. No collected string becomes HTML, a path, URL, WMI query, shell argument or executable instruction.

A customized driver/device description can still contain personally chosen text. The UI therefore asks the user to inspect the JSON before importing or sharing it.

## Build and checksum

CI builds on `windows-2022` with the installed Visual Studio 2022 MSBuild and the .NET Framework 4.8 reference assemblies:

```powershell
msbuild collectors/windows-exe/LinuxMigrationCompanion.WindowsCollector.csproj /m /t:Rebuild /p:Configuration=Release "/p:PathMap=<repository-root>=."
msbuild collectors/windows-exe/tests/LinuxMigrationCompanion.WindowsCollector.Tests.csproj /m /t:Rebuild /p:Configuration=Release "/p:PathMap=<repository-root>=."
collectors/windows-exe/tests/bin/Release/LinuxMigrationCompanion.WindowsCollector.Tests.exe <repository-root>
```

The project enables deterministic compilation, release optimization, no PDB and no package restore. CI publishes:

- the unsigned executable;
- `LinuxMigrationCompanion-HardwareSnapshot.exe.sha256`;
- `BUILD-INFO.txt` containing source commit, runner image/version, MSBuild version, target and checksum.

The checked-in unsigned `0.3.0` artifact is 39,936 bytes with SHA-256 `19b69cfe8c9ebfa22ce3e002af734a036dfc102e8934c47fb70cf5a201602ea7`. It was built from branch commit `d679ce9ff7dec65017e0f64e057f39b9b44c1ca8` on runner image `windows-2022` version `20260802.262.1` with MSBuild `17.14.51.32402`. The adjacent `.sha256` file is the browser-downloadable checksum. Two independent CI builds with that toolchain produced byte-identical executable files; this is useful evidence, not a claim of hermetic reproducibility across future runner images.

This gives traceable and repeatable builds with the same toolchain. The GitHub-hosted runner image is still a moving dependency, so the project does not claim hermetic byte-for-byte reproducibility across arbitrary future runner revisions. A tagged release should preserve its build-info record and artifact attestation.

## Recommended signing process for a future signed build

1. Protect and review a release tag/commit; all web, C# tests, audit and CodeQL checks must pass.
2. Build the unsigned executable from that exact commit in the controlled Windows workflow and record its SHA-256 and build provenance.
3. Sign that exact artifact with a publicly trusted Authenticode identity whose private key is held in hardware-backed storage or a managed signing service. Credentials must be injected only into a protected release environment; they must never enter the repository or pull-request workflows.
4. Use SHA-256 file digest and a signing-provider-approved RFC 3161 timestamp service.
5. Verify the signature and chain with `signtool verify /pa /all /v` on the release runner.
6. Compute and publish the SHA-256 of the **signed** bytes, attach the signed executable, checksum, source commit and provenance to the release, and make the website reference that exact artifact.
7. Double-click the downloaded signed artifact as an ordinary user on clean Windows 10 and Windows 11 systems. Verify publisher identity, SmartScreen behavior, UI, output, privacy and import before public linking.

Microsoft documents Authenticode options for Windows applications in [Code signing options for Windows app developers](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options). A valid signature establishes publisher/file integrity but does not guarantee immediate SmartScreen reputation. The release record must distinguish signature validity from reputation behavior.

No signing secret is available in this repository. CI therefore produces and labels only unsigned artifacts; it does not create a self-signed certificate or fake a trusted signature.

# Linux Migration Companion - Windows read-only hardware snapshot collector
# Version 1.0.0
#
# Reads an explicit allowlist of built-in CIM properties. It does not install,
# configure, upload, contact a network service, request elevation, or execute
# data from the generated JSON. The only write is one new JSON output file.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$MaximumFacts = 64

$AllowedCategories = @(
    "cpu", "graphics", "wifi", "ethernet", "bluetooth", "audio",
    "webcam", "fingerprint", "storage", "usb_controller"
)
$ProhibitedKeys = @(
    "username", "realname", "hostname", "computername", "accountname",
    "email", "emailaddress", "ipaddress", "macaddress", "ssid",
    "wifipassword", "networkhistory", "serial", "serialnumber",
    "systemserialnumber", "motherboardserialnumber", "diskserialnumber",
    "productkey", "activationid", "machineguid", "tpmendorsementidentifier",
    "browserhistory", "filename", "filenames", "directorylisting",
    "userfilecontents", "shellhistory", "environmentsecret", "token",
    "credentials", "sshkey", "sshkeys", "cloudaccount"
)

$Facts = New-Object 'System.Collections.Generic.List[object]'
$FactKeys = New-Object 'System.Collections.Generic.HashSet[string]'

function Limit-Text {
    param(
        [AllowNull()][object]$Value,
        [int]$Maximum
    )
    if ($null -eq $Value) { return $null }
    $Text = ([string]$Value) -replace '[\x00-\x1f\x7f]', ' '
    $Text = $Text.Trim()
    if ($Text.Length -eq 0) { return $null }
    if ($Text.Length -gt $Maximum) { return $Text.Substring(0, $Maximum) }
    return $Text
}

function Get-SafeCimRows {
    param(
        [string]$Query,
        [string]$Namespace = "root/cimv2"
    )
    try {
        return @(Get-CimInstance -Namespace $Namespace -Query $Query -ErrorAction Stop)
    }
    catch {
        return @()
    }
}

function Add-HardwareFact {
    param(
        [string]$Category,
        [AllowNull()][object]$Name,
        [AllowNull()][object]$Vendor = $null
    )
    if ($AllowedCategories -notcontains $Category -or $Facts.Count -ge $MaximumFacts) { return }
    $SafeName = Limit-Text -Value $Name -Maximum 160
    if ($null -eq $SafeName) { return }
    $SafeVendor = Limit-Text -Value $Vendor -Maximum 100
    $Key = "$Category`0$SafeName`0$SafeVendor"
    if (-not $FactKeys.Add($Key)) { return }

    $Fact = [ordered]@{
        category = $Category
        name = $SafeName
    }
    if ($null -ne $SafeVendor) { $Fact.vendor = $SafeVendor }
    $Facts.Add($Fact)
}

function Assert-PrivacyKeys {
    param([AllowNull()][object]$Value)
    if ($null -eq $Value -or $Value -is [string]) { return }
    if ($Value -is [System.Collections.IDictionary]) {
        foreach ($Key in $Value.Keys) {
            $Normalized = ([string]$Key).ToLowerInvariant() -replace '[^a-z0-9]', ''
            if ($ProhibitedKeys -contains $Normalized -or @("__proto__", "prototype", "constructor") -contains [string]$Key) {
                throw "Collector privacy self-check rejected output key: $Key"
            }
            Assert-PrivacyKeys -Value $Value[$Key]
        }
        return
    }
    if ($Value -is [System.Collections.IEnumerable]) {
        foreach ($Item in $Value) { Assert-PrivacyKeys -Value $Item }
    }
}

function Normalize-Architecture {
    param([AllowNull()][object]$Architecture)
    $Text = ([string]$Architecture).ToLowerInvariant()
    if ($Text -match 'arm64') { return "arm64" }
    if ($Text -match 'arm') { return "arm" }
    if ($Text -match '64') { return "x86_64" }
    if ($Text -match '32|86') { return "x86" }
    return "unknown"
}

$OperatingSystems = Get-SafeCimRows -Query "SELECT Caption,OSArchitecture FROM Win32_OperatingSystem"
$ComputerSystems = Get-SafeCimRows -Query "SELECT PCSystemType,TotalPhysicalMemory,HypervisorPresent FROM Win32_ComputerSystem"
$Processors = Get-SafeCimRows -Query "SELECT Name,Manufacturer,NumberOfLogicalProcessors,VMMonitorModeExtensions,VirtualizationFirmwareEnabled FROM Win32_Processor"

foreach ($Processor in $Processors) {
    Add-HardwareFact -Category "cpu" -Name $Processor.Name -Vendor $Processor.Manufacturer
}

$LogicalProcessors = 0
foreach ($Processor in $Processors) {
    if ($null -ne $Processor.NumberOfLogicalProcessors) {
        $LogicalProcessors += [int]$Processor.NumberOfLogicalProcessors
    }
}

$Virtualization = "unknown"
if (@($Processors | Where-Object { $_.VirtualizationFirmwareEnabled -eq $true }).Count -gt 0) {
    $Virtualization = "enabled"
}
elseif (@($Processors | Where-Object { $_.VMMonitorModeExtensions -eq $true }).Count -gt 0) {
    $Virtualization = "supported"
}

$PrimarySystem = $ComputerSystems | Select-Object -First 1
$FormFactor = "unknown"
if ($null -ne $PrimarySystem) {
    switch ([int]$PrimarySystem.PCSystemType) {
        1 { $FormFactor = "desktop" }
        2 { $FormFactor = "laptop" }
        3 { $FormFactor = "desktop" }
        8 { $FormFactor = "tablet" }
        default { $FormFactor = "unknown" }
    }
    if ($PrimarySystem.HypervisorPresent -eq $true) {
        $Virtualization = "enabled"
    }
}

$MemoryGiB = $null
if ($null -ne $PrimarySystem -and $null -ne $PrimarySystem.TotalPhysicalMemory) {
    $MemoryGiB = [Math]::Round(([double]$PrimarySystem.TotalPhysicalMemory / 1GB), 2)
}

$Firmware = "unknown"
try {
    $FirmwareValue = (Get-ComputerInfo -Property BiosFirmwareType -ErrorAction Stop).BiosFirmwareType
    if ([string]$FirmwareValue -match 'Uefi') { $Firmware = "uefi" }
    elseif ([string]$FirmwareValue -match 'Bios|Legacy') { $Firmware = "legacy" }
}
catch { $Firmware = "unknown" }

# Confirm-SecureBootUEFI requires an elevated PowerShell session. The collector
# deliberately does not request elevation, so Secure Boot remains unavailable.
$SecureBoot = "unavailable"

$VideoControllers = Get-SafeCimRows -Query "SELECT Name,AdapterCompatibility FROM Win32_VideoController"
foreach ($Controller in $VideoControllers) {
    Add-HardwareFact -Category "graphics" -Name $Controller.Name -Vendor $Controller.AdapterCompatibility
}

$NetworkAdapters = Get-SafeCimRows -Namespace "root/StandardCimv2" -Query "SELECT InterfaceDescription,NdisPhysicalMedium,HardwareInterface FROM MSFT_NetAdapter"
foreach ($Adapter in @($NetworkAdapters | Where-Object { $_.HardwareInterface -eq $true })) {
    switch ([int]$Adapter.NdisPhysicalMedium) {
        1 { Add-HardwareFact -Category "wifi" -Name $Adapter.InterfaceDescription }
        9 { Add-HardwareFact -Category "wifi" -Name $Adapter.InterfaceDescription }
        10 { Add-HardwareFact -Category "bluetooth" -Name $Adapter.InterfaceDescription }
        14 { Add-HardwareFact -Category "ethernet" -Name $Adapter.InterfaceDescription }
    }
}

if (@($NetworkAdapters).Count -eq 0) {
    $LegacyAdapters = Get-SafeCimRows -Query "SELECT Name,Manufacturer,AdapterTypeID,PhysicalAdapter FROM Win32_NetworkAdapter"
    foreach ($Adapter in @($LegacyAdapters | Where-Object { $_.PhysicalAdapter -eq $true })) {
        if ([int]$Adapter.AdapterTypeID -eq 9) {
            Add-HardwareFact -Category "wifi" -Name $Adapter.Name -Vendor $Adapter.Manufacturer
        }
        elseif ([int]$Adapter.AdapterTypeID -eq 0) {
            Add-HardwareFact -Category "ethernet" -Name $Adapter.Name -Vendor $Adapter.Manufacturer
        }
    }
}

$SoundDevices = Get-SafeCimRows -Query "SELECT Name,Manufacturer FROM Win32_SoundDevice"
foreach ($Device in $SoundDevices) {
    Add-HardwareFact -Category "audio" -Name $Device.Name -Vendor $Device.Manufacturer
}

$Disks = Get-SafeCimRows -Query "SELECT Model,InterfaceType,MediaType,Size FROM Win32_DiskDrive"
foreach ($Disk in $Disks) {
    $DiskModel = Limit-Text -Value $Disk.Model -Maximum 120
    $DiskDetails = @()
    if ($null -ne $Disk.InterfaceType) { $DiskDetails += (Limit-Text -Value $Disk.InterfaceType -Maximum 24) }
    if ($null -ne $Disk.MediaType) { $DiskDetails += (Limit-Text -Value $Disk.MediaType -Maximum 48) }
    if ($null -ne $Disk.Size) { $DiskDetails += "$([Math]::Round(([double]$Disk.Size / 1GB), 1)) GiB" }
    $DiskName = $DiskModel
    if ($null -ne $DiskModel -and $DiskDetails.Count -gt 0) {
        $DiskName = "$DiskModel ($($DiskDetails -join ', '))"
    }
    elseif ($null -eq $DiskModel -and $DiskDetails.Count -gt 0) {
        $DiskName = $DiskDetails -join " · "
    }
    Add-HardwareFact -Category "storage" -Name $DiskName
}

$UsbControllers = Get-SafeCimRows -Query "SELECT Name,Manufacturer FROM Win32_USBController"
foreach ($Controller in $UsbControllers) {
    Add-HardwareFact -Category "usb_controller" -Name $Controller.Name -Vendor $Controller.Manufacturer
}

$PnPDevices = Get-SafeCimRows -Query "SELECT Name,Manufacturer,PNPClass,Service FROM Win32_PnPEntity WHERE Service = 'usbvideo' OR PNPClass = 'Biometric'"
foreach ($Device in $PnPDevices) {
    if ([string]$Device.Service -match '^usbvideo$' -and [string]$Device.PNPClass -match '^(Camera|Image)$') {
        Add-HardwareFact -Category "webcam" -Name $Device.Name -Vendor $Device.Manufacturer
    }
    elseif ([string]$Device.PNPClass -match '^Biometric$') {
        Add-HardwareFact -Category "fingerprint" -Name $Device.Name -Vendor $Device.Manufacturer
    }
}

$Monitors = Get-SafeCimRows -Query "SELECT Status FROM Win32_DesktopMonitor"
$ConnectedDisplays = @($Monitors | Where-Object { $_.Status -eq "OK" }).Count

$PrimaryOperatingSystem = $OperatingSystems | Select-Object -First 1
$OperatingSystemArchitecture = $null
if ($null -ne $PrimaryOperatingSystem) {
    $OperatingSystemArchitecture = $PrimaryOperatingSystem.OSArchitecture
}
$System = [ordered]@{
    osFamily = "windows"
    architecture = Normalize-Architecture -Architecture $OperatingSystemArchitecture
    formFactor = $FormFactor
    firmware = $Firmware
    secureBoot = $SecureBoot
    virtualization = $Virtualization
}
$OsLabel = $null
if ($null -ne $PrimaryOperatingSystem) {
    $OsLabel = Limit-Text -Value $PrimaryOperatingSystem.Caption -Maximum 120
}
if ($null -ne $OsLabel) { $System.osLabel = $OsLabel }
if ($LogicalProcessors -ge 1 -and $LogicalProcessors -le 4096) { $System.logicalProcessors = $LogicalProcessors }
if ($null -ne $MemoryGiB -and $MemoryGiB -ge 0.25 -and $MemoryGiB -le 16384) { $System.memoryGiB = $MemoryGiB }
if ($ConnectedDisplays -ge 0) { $System.connectedDisplays = [Math]::Min($ConnectedDisplays, 64) }

$Snapshot = [ordered]@{
    schemaVersion = 1
    product = "linux-migration-companion-hardware-snapshot"
    createdAt = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    source = "windows_collector"
    collector = [ordered]@{
        id = "windows-powershell"
        version = "1.0.0"
    }
    system = $System
    facts = @($Facts)
}

Assert-PrivacyKeys -Value $Snapshot
$Json = $Snapshot | ConvertTo-Json -Depth 7

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $FileName = "linux-migration-hardware-snapshot-$([DateTime]::Now.ToString('yyyyMMdd-HHmmss')).json"
    $OutputPath = Join-Path -Path (Get-Location) -ChildPath $FileName
}
$FullOutputPath = [IO.Path]::GetFullPath($OutputPath)
if ([IO.Path]::GetExtension($FullOutputPath).ToLowerInvariant() -ne ".json") {
    throw "Output path must end in .json"
}
$ParentDirectory = [IO.Path]::GetDirectoryName($FullOutputPath)
if (-not [IO.Directory]::Exists($ParentDirectory)) {
    throw "Output directory does not exist"
}

$Stream = [IO.File]::Open($FullOutputPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
try {
    $Writer = New-Object IO.StreamWriter($Stream, (New-Object Text.UTF8Encoding($false)))
    try { $Writer.Write($Json) }
    finally { $Writer.Dispose() }
}
finally {
    if ($null -ne $Stream) { $Stream.Dispose() }
}

Write-Host "Hardware snapshot written to: $FullOutputPath"
Write-Host "Inspect the JSON before importing it. Detection is not Linux compatibility."

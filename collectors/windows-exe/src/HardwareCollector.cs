using System;
using System.Collections.Generic;
using System.Globalization;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal sealed class HardwareCollector
    {
        internal const string CurrentVersion = "1.1.0";
        private const int MaximumFacts = 64;
        private const string CimV2 = @"\\.\root\cimv2";
        private const string StandardCimV2 = @"\\.\root\StandardCimv2";

        private readonly IHardwareDataSource source;
        private readonly List<HardwareFact> facts = new List<HardwareFact>();
        private readonly HashSet<string> factKeys = new HashSet<string>(StringComparer.Ordinal);

        public HardwareCollector(IHardwareDataSource source)
        {
            this.source = source ?? throw new ArgumentNullException("source");
        }

        public HardwareSnapshot Collect()
        {
            facts.Clear();
            factKeys.Clear();

            IList<HardwareRow> operatingSystems = Query(
                CimV2,
                "SELECT Caption,OSArchitecture FROM Win32_OperatingSystem",
                "Caption", "OSArchitecture");
            IList<HardwareRow> computerSystems = Query(
                CimV2,
                "SELECT Model,Manufacturer,PCSystemType,TotalPhysicalMemory,HypervisorPresent FROM Win32_ComputerSystem",
                "Model", "Manufacturer", "PCSystemType", "TotalPhysicalMemory", "HypervisorPresent");
            IList<HardwareRow> processors = Query(
                CimV2,
                "SELECT Name,Manufacturer,NumberOfLogicalProcessors,VMMonitorModeExtensions,VirtualizationFirmwareEnabled FROM Win32_Processor",
                "Name", "Manufacturer", "NumberOfLogicalProcessors", "VMMonitorModeExtensions", "VirtualizationFirmwareEnabled");

            int logicalProcessors = 0;
            bool virtualizationEnabled = false;
            bool virtualizationSupported = false;
            foreach (HardwareRow processor in processors)
            {
                AddFact("cpu", processor.Get("Name"), processor.Get("Manufacturer"));
                int? count = processor.Integer("NumberOfLogicalProcessors");
                if (count.HasValue && count.Value > 0 && logicalProcessors <= 4096 - count.Value)
                {
                    logicalProcessors += count.Value;
                }
                if (processor.Boolean("VirtualizationFirmwareEnabled") == true) virtualizationEnabled = true;
                if (processor.Boolean("VMMonitorModeExtensions") == true) virtualizationSupported = true;
            }

            HardwareRow primarySystem = computerSystems.Count > 0 ? computerSystems[0] : null;
            string formFactor = FormFactor(primarySystem);
            if (primarySystem != null && IsVirtualMachine(primarySystem)) formFactor = "virtual";
            if (primarySystem != null && primarySystem.Boolean("HypervisorPresent") == true) virtualizationEnabled = true;

            double? memoryGiB = null;
            if (primarySystem != null)
            {
                ulong? memoryBytes = primarySystem.UnsignedLong("TotalPhysicalMemory");
                if (memoryBytes.HasValue)
                {
                    double value = Math.Round(memoryBytes.Value / 1073741824d, 2);
                    if (value >= 0.25d && value <= 16384d) memoryGiB = value;
                }
            }

            foreach (HardwareRow controller in Query(
                CimV2,
                "SELECT Name,AdapterCompatibility FROM Win32_VideoController",
                "Name", "AdapterCompatibility"))
            {
                AddFact("graphics", controller.Get("Name"), controller.Get("AdapterCompatibility"));
            }

            IList<HardwareRow> networkAdapters = Query(
                StandardCimV2,
                "SELECT InterfaceDescription,NdisPhysicalMedium,HardwareInterface FROM MSFT_NetAdapter",
                "InterfaceDescription", "NdisPhysicalMedium", "HardwareInterface");
            foreach (HardwareRow adapter in networkAdapters)
            {
                if (adapter.Boolean("HardwareInterface") != true) continue;
                int? medium = adapter.Integer("NdisPhysicalMedium");
                if (medium == 1 || medium == 9) AddFact("wifi", adapter.Get("InterfaceDescription"), null);
                else if (medium == 10) AddFact("bluetooth", adapter.Get("InterfaceDescription"), null);
                else if (medium == 14) AddFact("ethernet", adapter.Get("InterfaceDescription"), null);
            }

            if (networkAdapters.Count == 0)
            {
                foreach (HardwareRow adapter in Query(
                    CimV2,
                    "SELECT Name,Manufacturer,AdapterTypeID,PhysicalAdapter FROM Win32_NetworkAdapter",
                    "Name", "Manufacturer", "AdapterTypeID", "PhysicalAdapter"))
                {
                    if (adapter.Boolean("PhysicalAdapter") != true) continue;
                    int? adapterType = adapter.Integer("AdapterTypeID");
                    if (adapterType == 9) AddFact("wifi", adapter.Get("Name"), adapter.Get("Manufacturer"));
                    else if (adapterType == 0) AddFact("ethernet", adapter.Get("Name"), adapter.Get("Manufacturer"));
                }
            }

            foreach (HardwareRow device in Query(
                CimV2,
                "SELECT Name,Manufacturer FROM Win32_SoundDevice",
                "Name", "Manufacturer"))
            {
                AddFact("audio", device.Get("Name"), device.Get("Manufacturer"));
            }

            foreach (HardwareRow disk in Query(
                CimV2,
                "SELECT Model,InterfaceType,MediaType,Size FROM Win32_DiskDrive",
                "Model", "InterfaceType", "MediaType", "Size"))
            {
                string model = TextSafety.Limit(disk.Get("Model"), 120);
                List<string> details = new List<string>();
                AddText(details, disk.Get("InterfaceType"), 24);
                AddText(details, disk.Get("MediaType"), 48);
                ulong? size = disk.UnsignedLong("Size");
                if (size.HasValue)
                {
                    details.Add(string.Format(CultureInfo.InvariantCulture, "{0:0.0} GiB", size.Value / 1073741824d));
                }
                string description = model;
                if (model != null && details.Count > 0) description = model + " (" + string.Join(", ", details) + ")";
                else if (model == null && details.Count > 0) description = string.Join(", ", details);
                AddFact("storage", description, null);
            }

            foreach (HardwareRow controller in Query(
                CimV2,
                "SELECT Name,Manufacturer FROM Win32_USBController",
                "Name", "Manufacturer"))
            {
                AddFact("usb_controller", controller.Get("Name"), controller.Get("Manufacturer"));
            }

            foreach (HardwareRow device in Query(
                CimV2,
                "SELECT Name,Manufacturer,PNPClass,Service FROM Win32_PnPEntity WHERE Service = 'usbvideo' OR PNPClass = 'Biometric'",
                "Name", "Manufacturer", "PNPClass", "Service"))
            {
                string service = device.Text("Service") ?? string.Empty;
                string pnpClass = device.Text("PNPClass") ?? string.Empty;
                if (service.Equals("usbvideo", StringComparison.OrdinalIgnoreCase) &&
                    (pnpClass.Equals("Camera", StringComparison.OrdinalIgnoreCase) || pnpClass.Equals("Image", StringComparison.OrdinalIgnoreCase)))
                {
                    AddFact("webcam", device.Get("Name"), device.Get("Manufacturer"));
                }
                else if (pnpClass.Equals("Biometric", StringComparison.OrdinalIgnoreCase))
                {
                    AddFact("fingerprint", device.Get("Name"), device.Get("Manufacturer"));
                }
            }

            IList<HardwareRow> monitors = Query(CimV2, "SELECT Status FROM Win32_DesktopMonitor", "Status");
            int? connectedDisplays = null;
            if (monitors.Count > 0)
            {
                int connected = 0;
                foreach (HardwareRow monitor in monitors)
                {
                    if (string.Equals(monitor.Text("Status"), "OK", StringComparison.OrdinalIgnoreCase)) connected++;
                }
                connectedDisplays = Math.Min(connected, 64);
            }

            HardwareRow primaryOperatingSystem = operatingSystems.Count > 0 ? operatingSystems[0] : null;
            string virtualization = virtualizationEnabled ? "enabled" : virtualizationSupported ? "supported" : "unknown";
            FirmwareKind firmwareKind = source.ReadFirmwareKind();

            return new HardwareSnapshot
            {
                SchemaVersion = 1,
                Product = "linux-migration-companion-hardware-snapshot",
                CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture),
                Source = "windows_collector",
                Collector = new CollectorIdentity { Id = "windows-dotnet", Version = CurrentVersion },
                System = new SnapshotSystem
                {
                    OsFamily = "windows",
                    OsLabel = primaryOperatingSystem == null ? null : TextSafety.Limit(primaryOperatingSystem.Get("Caption"), 120),
                    Architecture = TextSafety.NormalizeArchitecture(primaryOperatingSystem == null ? null : primaryOperatingSystem.Get("OSArchitecture")),
                    FormFactor = formFactor,
                    LogicalProcessors = logicalProcessors >= 1 && logicalProcessors <= 4096 ? (int?)logicalProcessors : null,
                    MemoryGiB = memoryGiB,
                    Firmware = firmwareKind == FirmwareKind.Uefi ? "uefi" : firmwareKind == FirmwareKind.Bios ? "legacy" : "unknown",
                    SecureBoot = "unavailable",
                    Virtualization = virtualization,
                    ConnectedDisplays = connectedDisplays
                },
                Facts = new List<HardwareFact>(facts)
            };
        }

        private IList<HardwareRow> Query(string scope, string query, params string[] properties)
        {
            try { return source.Query(scope, query, properties) ?? new List<HardwareRow>(); }
            catch (Exception error) when (error is System.Management.ManagementException || error is System.Runtime.InteropServices.COMException || error is UnauthorizedAccessException || error is InvalidOperationException)
            {
                return new List<HardwareRow>();
            }
        }

        private void AddFact(string category, object nameValue, object vendorValue)
        {
            if (facts.Count >= MaximumFacts) return;
            string name = TextSafety.Limit(nameValue, 160);
            if (name == null) return;
            string vendor = TextSafety.Limit(vendorValue, 100);
            string key = category + "\0" + name + "\0" + (vendor ?? string.Empty);
            if (!factKeys.Add(key)) return;
            facts.Add(new HardwareFact { Category = category, Name = name, Vendor = vendor });
        }

        private static void AddText(ICollection<string> target, object value, int maximum)
        {
            string text = TextSafety.Limit(value, maximum);
            if (text != null) target.Add(text);
        }

        private static string FormFactor(HardwareRow system)
        {
            if (system == null) return "unknown";
            switch (system.Integer("PCSystemType"))
            {
                case 1: return "desktop";
                case 2: return "laptop";
                case 3: return "desktop";
                case 8: return "tablet";
                default: return "unknown";
            }
        }

        private static bool IsVirtualMachine(HardwareRow system)
        {
            string identity = ((system.Text("Manufacturer") ?? string.Empty) + " " + (system.Text("Model") ?? string.Empty)).ToLowerInvariant();
            return identity.Contains("virtual machine") || identity.Contains("vmware") || identity.Contains("virtualbox") ||
                   identity.Contains("qemu") || identity.Contains("kvm") || identity.Contains("xen") || identity.Contains("parallels");
        }
    }
}

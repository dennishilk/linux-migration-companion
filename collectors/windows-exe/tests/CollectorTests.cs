using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Management;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal static class CollectorTests
    {
        private static int passed;
        private static string repositoryRoot;

        private static int Main(string[] args)
        {
            repositoryRoot = args.Length > 0 ? Path.GetFullPath(args[0]) : Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", ".."));
            Run("generated snapshot satisfies schema-v1 shape", GeneratedSnapshotHasSchemaShape);
            Run("privacy fields are absent", PrivacyFieldsAreAbsent);
            Run("queries omit user, host, network and unique identifiers", QueryAllowlistExcludesPrivateFields);
            Run("collector performs no file or user-file enumeration", NoFileEnumeration);
            Run("collector source has no network or command-process client", NoNetworkOrCommandProcess);
            Run("multiple GPUs remain distinct", MultipleGpusRemainDistinct);
            Run("multiple adapters remain distinct", MultipleAdaptersRemainDistinct);
            Run("virtual-machine form factor is conservative", VirtualMachineClassification);
            Run("manifest requests ordinary-user execution", ManifestUsesAsInvoker);
            Run("output uses Downloads-style create-new naming", OutputPathIsPredictableAndCreateNew);
            Run("missing output directory fails without fallback writes", MissingOutputDirectoryFails);
            Run("WMI access failure degrades to unknown", QueryFailureDegradesSafely);
            Run("JSON escaping preserves inert Unicode device text", JsonEscapingAndUnicode);
            Run("unusually long and malformed device text is bounded", LongAndMalformedTextIsBounded);
            Run("unavailable classes remain absent", UnavailableHardwareRemainsAbsent);
            Run("snapshot contains no compatibility claim", NoCompatibilityClaim);
            Run("duplicate facts are removed and output is capped", FactsAreUniqueAndCapped);
            Run("Secure Boot remains unavailable without elevation", SecureBootDoesNotElevate);
            Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{0}/18 Windows collector tests passed.", passed));
            return passed == 18 ? 0 : 1;
        }

        private static void Run(string name, Action test)
        {
            try
            {
                test();
                passed++;
                Console.WriteLine("PASS " + name);
            }
            catch (Exception error)
            {
                Console.Error.WriteLine("FAIL " + name + ": " + error.Message);
            }
        }

        private static void GeneratedSnapshotHasSchemaShape()
        {
            HardwareSnapshot snapshot = NewCollector().Collect();
            IDictionary<string, object> document = Parse(SnapshotJson.Serialize(snapshot));
            Equal(1, Convert.ToInt32(document["schemaVersion"], CultureInfo.InvariantCulture));
            Equal("linux-migration-companion-hardware-snapshot", document["product"]);
            Equal("windows_collector", document["source"]);
            IDictionary<string, object> collector = Dictionary(document["collector"]);
            Equal("windows-dotnet", collector["id"]);
            True(Regex.IsMatch(Convert.ToString(collector["version"], CultureInfo.InvariantCulture), @"^\d+\.\d+\.\d+$"), "Collector version must be semantic.");
            DateTimeOffset timestamp;
            True(DateTimeOffset.TryParse(Convert.ToString(document["createdAt"], CultureInfo.InvariantCulture), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out timestamp), "Timestamp must parse.");
            IDictionary<string, object> system = Dictionary(document["system"]);
            Equal("windows", system["osFamily"]);
            True(Array(document["facts"]).Count > 0, "Fixture should produce facts.");
            Equal(7, document.Keys.Count);
        }

        private static void PrivacyFieldsAreAbsent()
        {
            IDictionary<string, object> document = Parse(SnapshotJson.Serialize(NewCollector().Collect()));
            HashSet<string> forbidden = new HashSet<string>(new[]
            {
                "username", "hostname", "computername", "email", "ipaddress", "macaddress", "ssid",
                "serialnumber", "productkey", "machineguid", "filename", "browserhistory", "credentials", "token"
            }, StringComparer.Ordinal);
            foreach (string key in AllKeys(document))
            {
                string normalized = new string(key.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
                True(!forbidden.Contains(normalized), "Forbidden output key: " + key);
            }
        }

        private static void QueryAllowlistExcludesPrivateFields()
        {
            FakeSource source = Fixture();
            new HardwareCollector(source).Collect();
            string calls = string.Join("\n", source.Calls);
            foreach (string forbidden in new[] { "UserName", "ComputerName", "HostName", "MACAddress", "IPAddress", "SerialNumber", "ProductKey", "MachineGuid", "UUID", "PNPDeviceID" })
            {
                True(calls.IndexOf(forbidden, StringComparison.OrdinalIgnoreCase) < 0, "Query requested " + forbidden);
            }
        }

        private static void NoFileEnumeration()
        {
            FakeSource source = Fixture();
            new HardwareCollector(source).Collect();
            string calls = string.Join("\n", source.Calls);
            foreach (string forbidden in new[] { "CIM_DataFile", "CIM_Directory", "Win32_Directory", "Win32_LogicalFile", "Win32_UserAccount" })
            {
                True(calls.IndexOf(forbidden, StringComparison.OrdinalIgnoreCase) < 0, "Collector must not query " + forbidden);
            }
        }

        private static void NoNetworkOrCommandProcess()
        {
            string sourceDirectory = Path.Combine(repositoryRoot, "collectors", "windows-exe", "src");
            string combined = string.Join("\n", Directory.GetFiles(sourceDirectory, "*.cs").Select(File.ReadAllText));
            foreach (string forbidden in new[] { "System.Net", "HttpClient", "WebClient", "TcpClient", "UdpClient", "System.Net.Sockets", "Process.Start", "cmd.exe", "powershell.exe" })
            {
                True(combined.IndexOf(forbidden, StringComparison.OrdinalIgnoreCase) < 0, "Source contains prohibited network/process API: " + forbidden);
            }
        }

        private static void MultipleGpusRemainDistinct()
        {
            HardwareSnapshot snapshot = NewCollector().Collect();
            Equal(2, snapshot.Facts.Count(fact => fact.Category == "graphics"));
        }

        private static void MultipleAdaptersRemainDistinct()
        {
            HardwareSnapshot snapshot = NewCollector().Collect();
            Equal(2, snapshot.Facts.Count(fact => fact.Category == "wifi"));
            Equal(1, snapshot.Facts.Count(fact => fact.Category == "ethernet"));
        }

        private static void VirtualMachineClassification()
        {
            FakeSource source = Fixture();
            source.Rows["Win32_ComputerSystem"] = Rows(Row(
                "Model", "Virtual Machine", "Manufacturer", "Microsoft Corporation", "PCSystemType", 1,
                "TotalPhysicalMemory", 8589934592UL, "HypervisorPresent", true));
            HardwareSnapshot snapshot = new HardwareCollector(source).Collect();
            Equal("virtual", snapshot.System.FormFactor);
            Equal("enabled", snapshot.System.Virtualization);
        }

        private static void ManifestUsesAsInvoker()
        {
            string manifest = File.ReadAllText(Path.Combine(repositoryRoot, "collectors", "windows-exe", "app.manifest"));
            True(manifest.Contains("requestedExecutionLevel level=\"asInvoker\""), "Manifest must request asInvoker.");
            True(!manifest.Contains("requireAdministrator") && !manifest.Contains("highestAvailable"), "Manifest must not request elevation.");
            True(!manifest.Contains("uiAccess=\"true\""), "UI access must stay disabled.");
        }

        private static void OutputPathIsPredictableAndCreateNew()
        {
            string directory = Path.Combine(Path.GetTempPath(), "lmc-windows-tests-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                SnapshotFileWriter writer = new SnapshotFileWriter();
                DateTime time = new DateTime(2026, 8, 11, 18, 41, 48, DateTimeKind.Local);
                string first = writer.WriteNew(NewCollector().Collect(), directory, time);
                string firstContents = File.ReadAllText(first);
                string second = writer.WriteNew(NewCollector().Collect(), directory, time);
                Equal("linux-migration-hardware-snapshot-20260811-184148.json", Path.GetFileName(first));
                Equal("linux-migration-hardware-snapshot-20260811-184148-2.json", Path.GetFileName(second));
                Equal(firstContents, File.ReadAllText(first));
                Equal("windows-dotnet", Dictionary(Parse(File.ReadAllText(second))["collector"])["id"]);
            }
            finally
            {
                Directory.Delete(directory, true);
            }
        }

        private static void MissingOutputDirectoryFails()
        {
            string missing = Path.Combine(Path.GetTempPath(), "lmc-missing-" + Guid.NewGuid().ToString("N"));
            Throws<DirectoryNotFoundException>(() => new SnapshotFileWriter().WriteNew(NewCollector().Collect(), missing, DateTime.Now));
            True(!Directory.Exists(missing), "Writer must not invent directories.");
        }

        private static void QueryFailureDegradesSafely()
        {
            FakeSource source = new FakeSource { ThrowOnQuery = true, Firmware = FirmwareKind.Unknown };
            HardwareSnapshot snapshot = new HardwareCollector(source).Collect();
            Equal(0, snapshot.Facts.Count);
            Equal("unknown", snapshot.System.Architecture);
            Equal("unknown", snapshot.System.FormFactor);
            True(!snapshot.System.LogicalProcessors.HasValue, "Unavailable count must stay absent.");
        }

        private static void JsonEscapingAndUnicode()
        {
            string name = "Quoted \"adapter\" \\ Ω 高";
            FakeSource source = Fixture();
            source.Rows["Win32_VideoController"] = Rows(Row("Name", name, "AdapterCompatibility", "厂商"));
            string json = SnapshotJson.Serialize(new HardwareCollector(source).Collect());
            True(json.Contains("\\\"adapter\\\"") && json.Contains("\\\\"), "JSON must escape quotes and backslashes.");
            IDictionary<string, object> parsed = Parse(json);
            IList<object> facts = Array(parsed["facts"]);
            IDictionary<string, object> graphic = facts.Select(Dictionary).First(fact => Convert.ToString(fact["category"]) == "graphics");
            Equal(name, graphic["name"]);
        }

        private static void LongAndMalformedTextIsBounded()
        {
            string name = new string('x', 159) + "\ud800tail\u0001";
            FakeSource source = Fixture();
            source.Rows["Win32_VideoController"] = Rows(Row("Name", name, "AdapterCompatibility", new string('v', 130)));
            HardwareFact fact = new HardwareCollector(source).Collect().Facts.First(item => item.Category == "graphics");
            True(fact.Name.Length <= 160, "Name exceeded 160 characters.");
            True(fact.Vendor.Length == 100, "Vendor was not capped at 100 characters.");
            True(!HasUnpairedSurrogate(fact.Name), "Unpaired surrogate escaped sanitization.");
            True(fact.Name.IndexOf('\u0001') < 0, "Control character escaped sanitization.");
        }

        private static void UnavailableHardwareRemainsAbsent()
        {
            HardwareSnapshot snapshot = new HardwareCollector(new FakeSource { Firmware = FirmwareKind.Unknown }).Collect();
            Equal(0, snapshot.Facts.Count);
            True(!snapshot.System.ConnectedDisplays.HasValue, "Unavailable monitor query must not become zero.");
            Equal("unknown", snapshot.System.Firmware);
            Equal("unknown", snapshot.System.Virtualization);
        }

        private static void NoCompatibilityClaim()
        {
            string json = SnapshotJson.Serialize(NewCollector().Collect());
            True(json.IndexOf("compatible", StringComparison.OrdinalIgnoreCase) < 0, "Output made a compatibility claim.");
            True(json.IndexOf("supported", StringComparison.OrdinalIgnoreCase) < 0 || json.Contains("\"virtualization\":\"supported\""), "Only CPU virtualization support may use supported.");
        }

        private static void FactsAreUniqueAndCapped()
        {
            FakeSource source = Fixture();
            List<HardwareRow> controllers = new List<HardwareRow>();
            for (int index = 0; index < 80; index++) controllers.Add(Row("Name", "USB " + (index % 70), "Manufacturer", "Vendor"));
            source.Rows["Win32_USBController"] = controllers;
            HardwareSnapshot snapshot = new HardwareCollector(source).Collect();
            True(snapshot.Facts.Count <= 64, "Fact count exceeded 64.");
            Equal(snapshot.Facts.Count, snapshot.Facts.Select(fact => fact.Category + "\0" + fact.Name + "\0" + fact.Vendor).Distinct().Count());
        }

        private static void SecureBootDoesNotElevate()
        {
            HardwareSnapshot snapshot = NewCollector().Collect();
            Equal("unavailable", snapshot.System.SecureBoot);
            string source = File.ReadAllText(Path.Combine(repositoryRoot, "collectors", "windows-exe", "src", "HardwareCollector.cs"));
            True(source.IndexOf("Confirm-SecureBoot", StringComparison.OrdinalIgnoreCase) < 0, "Collector must not invoke elevated Secure Boot tooling.");
        }

        private static HardwareCollector NewCollector()
        {
            return new HardwareCollector(Fixture());
        }

        private static FakeSource Fixture()
        {
            FakeSource source = new FakeSource { Firmware = FirmwareKind.Uefi };
            source.Rows["Win32_OperatingSystem"] = Rows(Row("Caption", "Microsoft Windows 11 Pro", "OSArchitecture", "64-bit"));
            source.Rows["Win32_ComputerSystem"] = Rows(Row(
                "Model", "Migration Test Laptop", "Manufacturer", "Example Devices", "PCSystemType", 2,
                "TotalPhysicalMemory", 34359738368UL, "HypervisorPresent", false));
            source.Rows["Win32_Processor"] = Rows(Row(
                "Name", "Example CPU", "Manufacturer", "Example Silicon", "NumberOfLogicalProcessors", 16,
                "VMMonitorModeExtensions", true, "VirtualizationFirmwareEnabled", true));
            source.Rows["Win32_VideoController"] = Rows(
                Row("Name", "Integrated Graphics", "AdapterCompatibility", "Example Silicon"),
                Row("Name", "Discrete Graphics", "AdapterCompatibility", "Example Graphics"));
            source.Rows["MSFT_NetAdapter"] = Rows(
                Row("InterfaceDescription", "Internal Wi-Fi", "NdisPhysicalMedium", 9, "HardwareInterface", true),
                Row("InterfaceDescription", "USB Wi-Fi", "NdisPhysicalMedium", 1, "HardwareInterface", true),
                Row("InterfaceDescription", "Ethernet", "NdisPhysicalMedium", 14, "HardwareInterface", true),
                Row("InterfaceDescription", "Bluetooth", "NdisPhysicalMedium", 10, "HardwareInterface", true));
            source.Rows["Win32_SoundDevice"] = Rows(Row("Name", "Audio Device", "Manufacturer", "Example Audio"));
            source.Rows["Win32_DiskDrive"] = Rows(Row("Model", "NVMe Storage", "InterfaceType", "SCSI", "MediaType", "Fixed hard disk media", "Size", 1024000000000UL));
            source.Rows["Win32_USBController"] = Rows(Row("Name", "USB 3 Controller", "Manufacturer", "Example Silicon"));
            source.Rows["Win32_PnPEntity"] = Rows(
                Row("Name", "Web Camera", "Manufacturer", "Example Camera", "PNPClass", "Camera", "Service", "usbvideo"),
                Row("Name", "Fingerprint Sensor", "Manufacturer", "Example Sensor", "PNPClass", "Biometric", "Service", "WudfRd"));
            source.Rows["Win32_DesktopMonitor"] = Rows(Row("Status", "OK"), Row("Status", "OK"));
            return source;
        }

        private static HardwareRow Row(params object[] entries)
        {
            Dictionary<string, object> values = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            for (int index = 0; index < entries.Length; index += 2) values[(string)entries[index]] = entries[index + 1];
            return new HardwareRow(values);
        }

        private static List<HardwareRow> Rows(params HardwareRow[] rows)
        {
            return rows.ToList();
        }

        private static IDictionary<string, object> Parse(string json)
        {
            return Dictionary(new JavaScriptSerializer().DeserializeObject(json));
        }

        private static IDictionary<string, object> Dictionary(object value)
        {
            IDictionary<string, object> result = value as IDictionary<string, object>;
            if (result == null) throw new InvalidOperationException("Expected JSON object.");
            return result;
        }

        private static IList<object> Array(object value)
        {
            IEnumerable sequence = value as IEnumerable;
            if (sequence == null || value is string) throw new InvalidOperationException("Expected JSON array.");
            return sequence.Cast<object>().ToList();
        }

        private static IEnumerable<string> AllKeys(object value)
        {
            IDictionary<string, object> dictionary = value as IDictionary<string, object>;
            if (dictionary != null)
            {
                foreach (KeyValuePair<string, object> item in dictionary)
                {
                    yield return item.Key;
                    foreach (string child in AllKeys(item.Value)) yield return child;
                }
                yield break;
            }
            IEnumerable sequence = value as IEnumerable;
            if (sequence != null && !(value is string))
            {
                foreach (object item in sequence)
                {
                    foreach (string child in AllKeys(item)) yield return child;
                }
            }
        }

        private static bool HasUnpairedSurrogate(string value)
        {
            for (int index = 0; index < value.Length; index++)
            {
                if (char.IsHighSurrogate(value[index]))
                {
                    if (index + 1 >= value.Length || !char.IsLowSurrogate(value[index + 1])) return true;
                    index++;
                }
                else if (char.IsLowSurrogate(value[index])) return true;
            }
            return false;
        }

        private static void Equal(object expected, object actual)
        {
            if (!object.Equals(expected, actual)) throw new InvalidOperationException("Expected " + expected + ", got " + actual + ".");
        }

        private static void True(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }

        private static void Throws<T>(Action action) where T : Exception
        {
            try { action(); }
            catch (T) { return; }
            throw new InvalidOperationException("Expected " + typeof(T).Name + ".");
        }

        private sealed class FakeSource : IHardwareDataSource
        {
            public readonly IDictionary<string, IList<HardwareRow>> Rows = new Dictionary<string, IList<HardwareRow>>(StringComparer.OrdinalIgnoreCase);
            public readonly List<string> Calls = new List<string>();
            public FirmwareKind Firmware { get; set; }
            public bool ThrowOnQuery { get; set; }

            public IList<HardwareRow> Query(string scope, string query, params string[] properties)
            {
                Calls.Add(scope + " | " + query + " | " + string.Join(",", properties));
                if (ThrowOnQuery) throw new ManagementException("simulated unavailable provider");
                foreach (KeyValuePair<string, IList<HardwareRow>> item in Rows)
                {
                    if (query.IndexOf(item.Key, StringComparison.OrdinalIgnoreCase) >= 0) return item.Value;
                }
                return new List<HardwareRow>();
            }

            public FirmwareKind ReadFirmwareKind()
            {
                return Firmware;
            }
        }
    }
}

using System;
using System.Collections.Generic;
using System.Management;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal sealed class WindowsHardwareDataSource : IHardwareDataSource
    {
        public IList<HardwareRow> Query(string scope, string query, params string[] properties)
        {
            List<HardwareRow> rows = new List<HardwareRow>();
            EnumerationOptions options = new EnumerationOptions
            {
                ReturnImmediately = false,
                Rewindable = false,
                Timeout = TimeSpan.FromSeconds(8)
            };
            ManagementScope managementScope = new ManagementScope(scope);
            using (ManagementObjectSearcher searcher = new ManagementObjectSearcher(managementScope, new ObjectQuery(query), options))
            using (ManagementObjectCollection results = searcher.Get())
            {
                foreach (ManagementBaseObject result in results)
                {
                    Dictionary<string, object> values = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                    foreach (string property in properties)
                    {
                        object value = null;
                        try { value = result[property]; }
                        catch (ManagementException) { value = null; }
                        if (value == DBNull.Value) value = null;
                        values[property] = value;
                    }
                    rows.Add(new HardwareRow(values));
                    result.Dispose();
                }
            }
            return rows;
        }

        public FirmwareKind ReadFirmwareKind()
        {
            return NativeMethods.ReadFirmwareKind();
        }
    }
}

using System;
using System.Collections.Generic;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal sealed class HardwareSnapshot
    {
        public int SchemaVersion { get; set; }
        public string Product { get; set; }
        public string CreatedAt { get; set; }
        public string Source { get; set; }
        public CollectorIdentity Collector { get; set; }
        public SnapshotSystem System { get; set; }
        public List<HardwareFact> Facts { get; set; }
    }

    internal sealed class CollectorIdentity
    {
        public string Id { get; set; }
        public string Version { get; set; }
    }

    internal sealed class SnapshotSystem
    {
        public string OsFamily { get; set; }
        public string OsLabel { get; set; }
        public string Architecture { get; set; }
        public string FormFactor { get; set; }
        public int? LogicalProcessors { get; set; }
        public double? MemoryGiB { get; set; }
        public string Firmware { get; set; }
        public string SecureBoot { get; set; }
        public string Virtualization { get; set; }
        public int? ConnectedDisplays { get; set; }
    }

    internal sealed class HardwareFact
    {
        public string Category { get; set; }
        public string Name { get; set; }
        public string Vendor { get; set; }
    }

    internal sealed class HardwareRow
    {
        private readonly IDictionary<string, object> values;

        public HardwareRow(IDictionary<string, object> values)
        {
            this.values = values ?? new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        }

        public object Get(string key)
        {
            object value;
            return values.TryGetValue(key, out value) ? value : null;
        }

        public string Text(string key)
        {
            object value = Get(key);
            return value == null ? null : Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture);
        }

        public bool? Boolean(string key)
        {
            object value = Get(key);
            if (value == null) return null;
            try { return Convert.ToBoolean(value, System.Globalization.CultureInfo.InvariantCulture); }
            catch (FormatException) { return null; }
            catch (InvalidCastException) { return null; }
            catch (OverflowException) { return null; }
        }

        public int? Integer(string key)
        {
            object value = Get(key);
            if (value == null) return null;
            try { return Convert.ToInt32(value, System.Globalization.CultureInfo.InvariantCulture); }
            catch (FormatException) { return null; }
            catch (InvalidCastException) { return null; }
            catch (OverflowException) { return null; }
        }

        public ulong? UnsignedLong(string key)
        {
            object value = Get(key);
            if (value == null) return null;
            try { return Convert.ToUInt64(value, System.Globalization.CultureInfo.InvariantCulture); }
            catch (FormatException) { return null; }
            catch (InvalidCastException) { return null; }
            catch (OverflowException) { return null; }
        }
    }

    internal enum FirmwareKind
    {
        Unknown = 0,
        Bios = 1,
        Uefi = 2,
        Maximum = 3
    }

    internal interface IHardwareDataSource
    {
        IList<HardwareRow> Query(string scope, string query, params string[] properties);
        FirmwareKind ReadFirmwareKind();
    }
}

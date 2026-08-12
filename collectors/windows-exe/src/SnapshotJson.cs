using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web.Script.Serialization;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal static class SnapshotJson
    {
        private static readonly HashSet<string> ProhibitedKeys = new HashSet<string>(StringComparer.Ordinal)
        {
            "username", "realname", "hostname", "computername", "accountname",
            "email", "emailaddress", "ipaddress", "macaddress", "ssid",
            "wifipassword", "networkhistory", "serial", "serialnumber",
            "systemserialnumber", "motherboardserialnumber", "diskserialnumber",
            "productkey", "activationid", "machineguid", "tpmendorsementidentifier",
            "browserhistory", "filename", "filenames", "directorylisting",
            "userfilecontents", "shellhistory", "environmentsecret", "token",
            "credentials", "sshkey", "sshkeys", "cloudaccount"
        };

        public static string Serialize(HardwareSnapshot snapshot)
        {
            IDictionary<string, object> document = ToDocument(snapshot);
            AssertPrivacyKeys(document);
            JavaScriptSerializer serializer = new JavaScriptSerializer { MaxJsonLength = 128 * 1024 };
            string json = serializer.Serialize(document);
            if (json.IndexOf("compatible", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                throw new InvalidOperationException("Snapshot must not contain a compatibility claim.");
            }
            return json;
        }

        internal static IDictionary<string, object> ToDocument(HardwareSnapshot snapshot)
        {
            if (snapshot == null) throw new ArgumentNullException("snapshot");
            Dictionary<string, object> system = new Dictionary<string, object>
            {
                { "osFamily", snapshot.System.OsFamily },
                { "architecture", snapshot.System.Architecture },
                { "formFactor", snapshot.System.FormFactor },
                { "firmware", snapshot.System.Firmware },
                { "secureBoot", snapshot.System.SecureBoot },
                { "virtualization", snapshot.System.Virtualization }
            };
            AddOptional(system, "osLabel", snapshot.System.OsLabel);
            AddOptional(system, "logicalProcessors", snapshot.System.LogicalProcessors);
            AddOptional(system, "memoryGiB", snapshot.System.MemoryGiB);
            AddOptional(system, "connectedDisplays", snapshot.System.ConnectedDisplays);

            List<object> facts = snapshot.Facts.Select(fact =>
            {
                Dictionary<string, object> item = new Dictionary<string, object>
                {
                    { "category", fact.Category },
                    { "name", fact.Name }
                };
                AddOptional(item, "vendor", fact.Vendor);
                return (object)item;
            }).ToList();

            return new Dictionary<string, object>
            {
                { "schemaVersion", snapshot.SchemaVersion },
                { "product", snapshot.Product },
                { "createdAt", snapshot.CreatedAt },
                { "source", snapshot.Source },
                { "collector", new Dictionary<string, object>
                    {
                        { "id", snapshot.Collector.Id },
                        { "version", snapshot.Collector.Version }
                    }
                },
                { "system", system },
                { "facts", facts }
            };
        }

        internal static void AssertPrivacyKeys(object value)
        {
            IDictionary<string, object> dictionary = value as IDictionary<string, object>;
            if (dictionary != null)
            {
                foreach (KeyValuePair<string, object> item in dictionary)
                {
                    string normalized = new string(item.Key.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
                    if (ProhibitedKeys.Contains(normalized) || item.Key == "__proto__" || item.Key == "prototype" || item.Key == "constructor")
                    {
                        throw new InvalidOperationException("Collector privacy self-check rejected an output field.");
                    }
                    AssertPrivacyKeys(item.Value);
                }
                return;
            }

            IEnumerable sequence = value as IEnumerable;
            if (sequence != null && !(value is string))
            {
                foreach (object child in sequence) AssertPrivacyKeys(child);
            }
        }

        private static void AddOptional(IDictionary<string, object> target, string key, object value)
        {
            if (value != null) target.Add(key, value);
        }
    }
}

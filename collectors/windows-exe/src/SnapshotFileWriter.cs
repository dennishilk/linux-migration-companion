using System;
using System.IO;
using System.Text;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal sealed class SnapshotFileWriter
    {
        public string WriteToDownloads(HardwareSnapshot snapshot)
        {
            return WriteNew(snapshot, NativeMethods.GetDownloadsDirectory(), DateTime.Now);
        }

        internal string WriteNew(HardwareSnapshot snapshot, string directory, DateTime localTime)
        {
            if (snapshot == null) throw new ArgumentNullException("snapshot");
            if (string.IsNullOrWhiteSpace(directory)) throw new ArgumentException("Output directory is required.", "directory");

            string fullDirectory = Path.GetFullPath(directory);
            if (!Directory.Exists(fullDirectory)) throw new DirectoryNotFoundException("The output directory is not available.");

            string json = SnapshotJson.Serialize(snapshot);
            byte[] bytes = new UTF8Encoding(false, true).GetBytes(json);
            string stem = "linux-migration-hardware-snapshot-" + localTime.ToString("yyyyMMdd-HHmmss", System.Globalization.CultureInfo.InvariantCulture);

            for (int attempt = 1; attempt <= 100; attempt++)
            {
                string suffix = attempt == 1 ? string.Empty : "-" + attempt.ToString(System.Globalization.CultureInfo.InvariantCulture);
                string candidate = Path.Combine(fullDirectory, stem + suffix + ".json");
                if (File.Exists(candidate)) continue;

                bool created = false;
                try
                {
                    using (FileStream stream = new FileStream(candidate, FileMode.CreateNew, FileAccess.Write, FileShare.None, 4096, FileOptions.WriteThrough))
                    {
                        created = true;
                        stream.Write(bytes, 0, bytes.Length);
                        stream.Flush(true);
                    }
                    return candidate;
                }
                catch (IOException)
                {
                    if (created)
                    {
                        try { File.Delete(candidate); }
                        catch (IOException) { }
                        catch (UnauthorizedAccessException) { }
                    }
                    if (File.Exists(candidate)) continue;
                    throw;
                }
                catch
                {
                    if (created)
                    {
                        try { File.Delete(candidate); }
                        catch (IOException) { }
                        catch (UnauthorizedAccessException) { }
                    }
                    throw;
                }
            }

            throw new IOException("Could not create a unique snapshot file name.");
        }
    }
}

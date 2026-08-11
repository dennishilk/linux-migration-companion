using System;
using System.IO;
using System.Runtime.InteropServices;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal static class NativeMethods
    {
        private static readonly Guid DownloadsFolder = new Guid("374DE290-123F-4565-9164-39C4925E467B");

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetFirmwareType(out FirmwareKind firmwareType);

        [DllImport("shell32.dll", CharSet = CharSet.Unicode, ExactSpelling = true)]
        private static extern int SHGetKnownFolderPath(
            ref Guid rfid,
            uint flags,
            IntPtr token,
            out IntPtr path);

        [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern IntPtr ShellExecuteW(
            IntPtr window,
            string operation,
            string file,
            string parameters,
            string directory,
            int showCommand);

        public static FirmwareKind ReadFirmwareKind()
        {
            FirmwareKind kind;
            return GetFirmwareType(out kind) ? kind : FirmwareKind.Unknown;
        }

        public static string GetDownloadsDirectory()
        {
            IntPtr pathPointer = IntPtr.Zero;
            Guid downloadsFolder = DownloadsFolder;
            try
            {
                if (SHGetKnownFolderPath(ref downloadsFolder, 0, IntPtr.Zero, out pathPointer) == 0 && pathPointer != IntPtr.Zero)
                {
                    string path = Marshal.PtrToStringUni(pathPointer);
                    if (!string.IsNullOrWhiteSpace(path) && Directory.Exists(path)) return Path.GetFullPath(path);
                }
            }
            finally
            {
                if (pathPointer != IntPtr.Zero) Marshal.FreeCoTaskMem(pathPointer);
            }

            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            if (!string.IsNullOrWhiteSpace(desktop) && Directory.Exists(desktop)) return Path.GetFullPath(desktop);
            string documents = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            if (!string.IsNullOrWhiteSpace(documents) && Directory.Exists(documents)) return Path.GetFullPath(documents);
            throw new DirectoryNotFoundException("No suitable user output folder is available.");
        }

        public static bool OpenFolder(string directory)
        {
            if (string.IsNullOrWhiteSpace(directory) || !Directory.Exists(directory)) return false;
            long result = ShellExecuteW(IntPtr.Zero, "open", Path.GetFullPath(directory), null, null, 1).ToInt64();
            return result > 32;
        }
    }
}

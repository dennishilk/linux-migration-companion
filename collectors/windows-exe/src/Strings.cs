using System.Globalization;

namespace LinuxMigrationCompanion.WindowsCollector
{
    internal sealed class Strings
    {
        public bool German { get; private set; }

        private Strings(bool german)
        {
            German = german;
        }

        public static Strings ForCurrentUser()
        {
            return new Strings(string.Equals(CultureInfo.CurrentUICulture.TwoLetterISOLanguageName, "de", System.StringComparison.OrdinalIgnoreCase));
        }

        private string Pick(string english, string german)
        {
            return German ? german : english;
        }

        public string WindowTitle { get { return "Linux Migration Companion — " + Pick("Hardware Snapshot", "Hardware-Snapshot"); } }
        public string Product { get { return "Linux Migration Companion"; } }
        public string Heading { get { return Pick("Hardware Snapshot", "Hardware-Snapshot"); } }
        public string Boundary { get { return Pick(
            "This tool reads only hardware information needed for migration planning. It does not test Linux compatibility and does not modify your system.",
            "Dieses Tool liest nur Hardware-Informationen, die für die Migrationsplanung benötigt werden. Es testet keine Linux-Kompatibilität und verändert dein System nicht."); } }
        public string Properties { get { return Pick(
            "Portable · open source · read only · no installation · no administrator rights · no upload",
            "Portabel · Open Source · nur lesend · keine Installation · keine Administratorrechte · kein Upload"); } }
        public string NotCollectedHeading { get { return Pick("Not collected", "Nicht erfasst"); } }
        public string NotCollected { get { return Pick(
            "Username; hostname or computer name; email; IP or MAC addresses; Wi-Fi SSID or password; serial numbers; product keys; machine GUIDs; files or file names; browser history; credentials; secrets or tokens.",
            "Benutzername; Host- oder Computername; E-Mail; IP- oder MAC-Adressen; WLAN-SSID oder -Passwort; Seriennummern; Produktschlüssel; Maschinen-GUIDs; Dateien oder Dateinamen; Browserverlauf; Zugangsdaten; Geheimnisse oder Token."); } }
        public string Destination { get { return Pick(
            "A new JSON snapshot will be created in your Downloads folder. Existing files are never overwritten.",
            "Ein neuer JSON-Snapshot wird im Downloads-Ordner erstellt. Bestehende Dateien werden niemals überschrieben."); } }
        public string Create { get { return Pick("&Create hardware snapshot", "&Hardware-Snapshot erstellen"); } }
        public string Creating { get { return Pick("Reading hardware…", "Hardware wird gelesen…"); } }
        public string Success { get { return Pick("Snapshot created successfully", "Snapshot erfolgreich erstellt"); } }
        public string OpenFolder { get { return Pick("&Open folder", "&Ordner öffnen"); } }
        public string Close { get { return Pick("&Close", "&Schließen"); } }
        public string ErrorHeading { get { return Pick("The snapshot could not be created", "Der Snapshot konnte nicht erstellt werden"); } }
        public string ErrorBody { get { return Pick(
            "No system setting was changed. Check that your Downloads folder is available and try again. You can still use the manual or browser path in the Companion.",
            "Keine Systemeinstellung wurde verändert. Prüfe, ob dein Downloads-Ordner verfügbar ist, und versuche es erneut. Im Companion bleiben der manuelle Weg und der Browser-Weg verfügbar."); } }
        public string FolderError { get { return Pick("Windows could not open the folder.", "Windows konnte den Ordner nicht öffnen."); } }
        public string Footer { get { return "© 2026 Dennis Hilk · MIT License"; } }
    }
}

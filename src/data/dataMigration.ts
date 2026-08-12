import type {
  DataMigrationId,
  DataMigrationMethod,
  LocalizedText
} from "../domain/types";

export interface DataMigrationDefinition {
  id: DataMigrationId;
  title: LocalizedText;
  description: LocalizedText;
  recommendedMethod: DataMigrationMethod;
  warning: LocalizedText;
}

const item = (
  id: DataMigrationId,
  titleEn: string,
  titleDe: string,
  descriptionEn: string,
  descriptionDe: string,
  recommendedMethod: DataMigrationMethod,
  warningEn: string,
  warningDe: string
): DataMigrationDefinition => ({
  id,
  title: { en: titleEn, de: titleDe },
  description: { en: descriptionEn, de: descriptionDe },
  recommendedMethod,
  warning: { en: warningEn, de: warningDe }
});

export const dataMigrationDefinitions: DataMigrationDefinition[] = [
  item("documents", "Documents", "Dokumente", "Local work files, templates and fonts.", "Lokale Arbeitsdateien, Vorlagen und Schriften.", "copy", "Open representative files after copying; existence is not format fidelity.", "Nach dem Kopieren repräsentative Dateien öffnen; Vorhandensein beweist keine Formattreue."),
  item("photos", "Photos", "Fotos", "Originals, edits, sidecars, catalogues and metadata.", "Originale, Bearbeitungen, Sidecars, Kataloge und Metadaten.", "copy", "Copy originals and catalogue/sidecar data; do not rely on exported previews.", "Originale sowie Katalog-/Sidecar-Daten kopieren; nicht auf exportierte Vorschauen verlassen."),
  item("videos", "Videos", "Videos", "Source footage, project files, proxies, codecs and exports.", "Quellmaterial, Projektdateien, Proxys, Codecs und Exporte.", "copy", "Project files can depend on absolute paths, plugins, fonts and proprietary codecs.", "Projektdateien können von absoluten Pfaden, Plugins, Schriften und proprietären Codecs abhängen."),
  item("browser_profile", "Browser profile", "Browserprofil", "Bookmarks, extensions, open sessions and locally stored data.", "Lesezeichen, Erweiterungen, Sitzungen und lokal gespeicherte Daten.", "sync", "Sync is not a complete backup; export bookmarks and record essential extensions separately.", "Synchronisation ist kein vollständiges Backup; Lesezeichen exportieren und wichtige Erweiterungen separat erfassen."),
  item("password_manager", "Password manager", "Passwortmanager", "Vault access, recovery material and browser integration.", "Tresorzugriff, Wiederherstellungsmaterial und Browserintegration.", "reconfigure", "Verify recovery access before changing the only working device; never place secrets in this Passport.", "Wiederherstellungszugriff vor Änderungen am einzigen funktionierenden Gerät prüfen; niemals Geheimnisse in diesen Passport schreiben."),
  item("email", "Email and calendars", "E-Mail und Kalender", "Accounts, local folders, rules, contacts and calendars.", "Konten, lokale Ordner, Regeln, Kontakte und Kalender.", "export_import", "Server mail may resync; local archives, rules and certificates may not.", "Server-E-Mails können neu synchronisieren; lokale Archive, Regeln und Zertifikate möglicherweise nicht."),
  item("outlook_archives", "Outlook PST/OST and add-ins", "Outlook-PST/OST und Add-ins", "Local Outlook archives and desktop-only integrations.", "Lokale Outlook-Archive und Desktop-exklusive Integrationen.", "do_not_assume", "An OST is usually a cache, not a portable archive. Test PST import and retention requirements separately.", "Eine OST ist meist ein Cache, kein portables Archiv. PST-Import und Aufbewahrung getrennt testen."),
  item("cloud_storage", "Other cloud storage", "Anderer Cloudspeicher", "Cloud files, shared folders and offline copies.", "Cloud-Dateien, Freigaben und Offline-Kopien.", "manual_check", "Confirm that every placeholder is downloaded before treating the Windows folder as a backup.", "Bestätigen, dass alle Platzhalter heruntergeladen sind, bevor der Windows-Ordner als Backup gilt."),
  item("onedrive", "OneDrive data", "OneDrive-Daten", "Personal or organizational OneDrive and SharePoint libraries.", "Persönliche oder geschäftliche OneDrive- und SharePoint-Bibliotheken.", "do_not_assume", "Files On-Demand placeholders are not local copies; organization policy may prohibit community sync clients.", "Files-On-Demand-Platzhalter sind keine lokalen Kopien; Organisationsrichtlinien können Community-Syncclients verbieten."),
  item("google_drive", "Google Drive data", "Google-Drive-Daten", "My Drive, shared drives and offline files.", "Meine Ablage, geteilte Ablagen und Offline-Dateien.", "manual_check", "The official desktop sync client and offline behaviour differ by platform.", "Offizieller Desktop-Syncclient und Offline-Verhalten unterscheiden sich je Plattform."),
  item("dropbox", "Dropbox data", "Dropbox-Daten", "Synced, online-only and team-managed folders.", "Synchronisierte, reine Online- und Team-Ordner.", "sync", "Make online-only files local before backup and verify Linux filesystem/client requirements.", "Reine Online-Dateien vor dem Backup lokal verfügbar machen und Linux-Dateisystem-/Client-Anforderungen prüfen."),
  item("steam_libraries", "Steam libraries", "Steam-Bibliotheken", "Installed game data on Windows filesystems.", "Installierte Spieldaten auf Windows-Dateisystemen.", "manual_check", "A reusable library does not prove Proton compatibility; avoid writing to hibernated/Fast-Startup NTFS.", "Eine wiederverwendbare Bibliothek beweist keine Proton-Kompatibilität; nicht auf durch Ruhezustand/Fast Startup gesperrtes NTFS schreiben."),
  item("game_saves", "Game saves and mods", "Spielstände und Mods", "Cloud and local saves, launchers, mod managers and profiles.", "Cloud- und lokale Spielstände, Launcher, Modmanager und Profile.", "export_import", "Cloud-save support varies by title; export local saves and mod profiles explicitly.", "Cloud-Spielstände unterscheiden sich je Titel; lokale Spielstände und Modprofile ausdrücklich exportieren."),
  item("ssh_keys", "SSH keys", "SSH-Schlüssel", "Private/public keys, agents, known hosts and hardware tokens.", "Private/öffentliche Schlüssel, Agenten, Known Hosts und Hardware-Token.", "reconfigure", "Copy keys only through a protected channel, preserve permissions and never store key material here.", "Schlüssel nur geschützt übertragen, Berechtigungen erhalten und niemals Schlüsselmaterial hier speichern."),
  item("git_repositories", "Git repositories", "Git-Repositories", "Committed and uncommitted work, remotes, hooks and LFS objects.", "Committe und uncommittete Arbeit, Remotes, Hooks und LFS-Objekte.", "copy", "A remote clone does not include uncommitted files, ignored assets, local hooks or every LFS object.", "Ein Remote-Clone enthält keine uncommitteten Dateien, ignorierten Assets, lokalen Hooks oder jedes LFS-Objekt."),
  item("development_projects", "Development projects", "Entwicklungsprojekte", "Source trees, SDKs, local configuration and build caches.", "Quellbäume, SDKs, lokale Konfiguration und Build-Caches.", "reconfigure", "Recreate toolchains from documented versions; inspect config files for machine paths and secrets.", "Toolchains aus dokumentierten Versionen neu aufbauen; Konfiguration auf Rechnerpfade und Geheimnisse prüfen."),
  item("local_databases", "Local databases", "Lokale Datenbanken", "Database files, services, schemas, users and extensions.", "Datenbankdateien, Dienste, Schemata, Benutzer und Erweiterungen.", "export_import", "Copying a live database file can be unsafe; use the database's consistent export/backup method.", "Das Kopieren einer laufenden Datenbank kann unsicher sein; konsistente Export-/Backupmethode der Datenbank verwenden."),
  item("application_data", "Application-specific data", "Anwendungsspezifische Daten", "Profiles, presets, licences, plug-ins and proprietary databases.", "Profile, Presets, Lizenzen, Plugins und proprietäre Datenbanken.", "do_not_assume", "Use the application's documented export path; a copied AppData folder may be incomplete or unusable.", "Den dokumentierten Exportweg der Anwendung nutzen; ein kopierter AppData-Ordner kann unvollständig oder unbrauchbar sein."),
  item("backups", "Backup and recovery", "Backup und Wiederherstellung", "Independent backup plus a proven restore path.", "Unabhängiges Backup mit nachgewiesenem Wiederherstellungsweg.", "manual_check", "Keep at least one backup disconnected from the migration machine and restore-test representative files.", "Mindestens ein Backup vom Migrationsrechner getrennt halten und repräsentative Dateien testweise wiederherstellen.")
];

export const dataMigrationById = new Map(
  dataMigrationDefinitions.map((definition) => [definition.id, definition])
);

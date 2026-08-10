import type { LiveTestId, LocalizedText } from "../domain/types";

export interface LiveTestDefinition {
  id: LiveTestId;
  title: LocalizedText;
  instruction: LocalizedText;
  essential: boolean;
}

export const liveTestDefinitions: LiveTestDefinition[] = [
  {
    id: "wifi",
    title: { en: "Wi-Fi", de: "WLAN" },
    instruction: {
      en: "Connect, browse for several minutes and reconnect after toggling Wi-Fi.",
      de: "Verbinden, mehrere Minuten surfen und nach Aus-/Einschalten erneut verbinden."
    },
    essential: true
  },
  {
    id: "ethernet",
    title: { en: "Ethernet", de: "Ethernet" },
    instruction: {
      en: "Connect a cable and confirm a stable network connection.",
      de: "Kabel verbinden und eine stabile Netzwerkverbindung bestätigen."
    },
    essential: false
  },
  {
    id: "graphics",
    title: { en: "Graphics", de: "Grafik" },
    instruction: {
      en: "Check native resolution, smooth movement and brightness controls.",
      de: "Native Auflösung, flüssige Darstellung und Helligkeitssteuerung prüfen."
    },
    essential: true
  },
  {
    id: "audio",
    title: { en: "Speakers / headphones", de: "Lautsprecher / Kopfhörer" },
    instruction: {
      en: "Play audio, change volume and test the output-device switch.",
      de: "Audio abspielen, Lautstärke ändern und den Ausgabegerätewechsel testen."
    },
    essential: true
  },
  {
    id: "bluetooth",
    title: { en: "Bluetooth", de: "Bluetooth" },
    instruction: {
      en: "Pair one device, disconnect it and reconnect it.",
      de: "Ein Gerät koppeln, trennen und erneut verbinden."
    },
    essential: false
  },
  {
    id: "suspend",
    title: { en: "Suspend / wake", de: "Standby / Aufwachen" },
    instruction: {
      en: "Suspend once, wait, wake and re-check network and sound.",
      de: "Einmal in Standby gehen, warten, aufwecken und Netzwerk sowie Audio erneut prüfen."
    },
    essential: true
  },
  {
    id: "external_monitor",
    title: { en: "External monitor", de: "Externer Monitor" },
    instruction: {
      en: "Test every connector, expected refresh rate and display arrangement.",
      de: "Jeden Anschluss, erwartete Bildrate und die Monitoranordnung testen."
    },
    essential: false
  },
  {
    id: "webcam",
    title: { en: "Webcam", de: "Webcam" },
    instruction: {
      en: "Open the camera preview and check image orientation and quality.",
      de: "Kameravorschau öffnen und Ausrichtung sowie Bildqualität prüfen."
    },
    essential: false
  },
  {
    id: "microphone",
    title: { en: "Microphone", de: "Mikrofon" },
    instruction: {
      en: "Record and replay speech using the microphone you actually need.",
      de: "Sprache mit dem tatsächlich benötigten Mikrofon aufnehmen und wiedergeben."
    },
    essential: false
  },
  {
    id: "printer",
    title: { en: "Printer / scanner", de: "Drucker / Scanner" },
    instruction: {
      en: "Print and scan a test page if this device matters to your workflow.",
      de: "Eine Testseite drucken und scannen, wenn das Gerät zum Arbeitsablauf gehört."
    },
    essential: false
  }
];

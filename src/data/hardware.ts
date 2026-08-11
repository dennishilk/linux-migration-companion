import type {
  HardwareClassId,
  LiveTestId,
  LocalizedText
} from "../domain/types";

export interface HardwareClassDefinition {
  id: HardwareClassId;
  title: LocalizedText;
  description: LocalizedText;
  liveTestId?: LiveTestId;
}

const entry = (
  id: HardwareClassId,
  en: string,
  de: string,
  descriptionEn: string,
  descriptionDe: string,
  liveTestId?: LiveTestId
): HardwareClassDefinition => ({
  id,
  title: { en, de },
  description: { en: descriptionEn, de: descriptionDe },
  ...(liveTestId ? { liveTestId } : {})
});

export const hardwareClasses: HardwareClassDefinition[] = [
  entry("graphics", "Graphics", "Grafik", "GPU vendor/model and the display functions you require.", "GPU-Anbieter/-Modell und die tatsächlich benötigten Darstellungsfunktionen.", "graphics"),
  entry("hybrid_graphics", "Hybrid graphics", "Hybrid-Grafik", "Laptop switching, external outputs and power behaviour can differ from a single-GPU desktop.", "Umschaltung, externe Ausgänge und Energieverhalten eines Laptops können sich deutlich von einem Desktop unterscheiden."),
  entry("wifi", "Wi-Fi", "WLAN", "Chipset recognition is not proof of stable connection, roaming or wake behaviour.", "Ein erkannter Chipsatz beweist keine stabile Verbindung, Roaming- oder Aufwachfunktion.", "wifi"),
  entry("bluetooth", "Bluetooth", "Bluetooth", "Record the adapters and the actual headsets, controllers or other devices you need.", "Adapter und die tatsächlich benötigten Headsets, Controller oder anderen Geräte erfassen.", "bluetooth"),
  entry("ethernet", "Ethernet", "Ethernet", "Include docks or USB adapters if they are part of the real workflow.", "Docks oder USB-Adapter einbeziehen, wenn sie zum echten Arbeitsablauf gehören.", "ethernet"),
  entry("audio", "Built-in audio", "Integriertes Audio", "Speakers, headphones, microphone routing and jack detection are separate checks.", "Lautsprecher, Kopfhörer, Mikrofon-Routing und Buchsenerkennung sind getrennte Prüfungen.", "audio"),
  entry("usb_audio", "USB audio interface", "USB-Audiointerface", "Control panels, firmware, low-latency modes and every input/output matter.", "Steuerprogramme, Firmware, niedrige Latenz und alle Ein-/Ausgänge sind relevant."),
  entry("webcam", "Webcam", "Webcam", "Verify the camera you actually use, including resolution and privacy controls.", "Die tatsächlich genutzte Kamera einschließlich Auflösung und Datenschutzsteuerung prüfen.", "webcam"),
  entry("microphone", "Microphone", "Mikrofon", "Confirm input selection, gain, monitoring and application access.", "Eingangswahl, Pegel, Monitoring und App-Zugriff bestätigen.", "microphone"),
  entry("fingerprint", "Fingerprint reader", "Fingerabdrucksensor", "A detected reader may still lack enrollment or login support.", "Ein erkannter Sensor kann trotzdem keine Registrierung oder Anmeldung unterstützen."),
  entry("dock", "Docking station", "Dockingstation", "Test charging, network, audio, USB and every display output together.", "Laden, Netzwerk, Audio, USB und alle Bildausgänge gemeinsam testen."),
  entry("external_monitors", "External / multiple monitors", "Externe / mehrere Monitore", "Test each connector, expected resolution, refresh rate, scaling and resume.", "Jeden Anschluss, erwartete Auflösung, Bildrate, Skalierung und Aufwachen prüfen.", "external_monitor"),
  entry("hidpi", "HiDPI / mixed scaling", "HiDPI / gemischte Skalierung", "Mixed-DPI displays and legacy applications can require separate verification.", "Monitore mit unterschiedlicher Pixeldichte und ältere Apps müssen getrennt geprüft werden."),
  entry("printer", "Printer", "Drucker", "Printing a page is the evidence; a manufacturer name alone is not.", "Eine gedruckte Testseite ist Evidenz; der Herstellername allein nicht.", "printer"),
  entry("scanner", "Scanner", "Scanner", "Test the required resolution, feeder, duplex mode and file destination.", "Benötigte Auflösung, Einzug, Duplexmodus und Dateiziel testen."),
  entry("capture_device", "Capture device", "Capture-Gerät", "Vendor control tools, firmware and high-bandwidth modes may be Windows-only.", "Hersteller-Tools, Firmware und Modi mit hoher Bandbreite können Windows-exklusiv sein."),
  entry("game_controller", "Game controller", "Gamecontroller", "Pairing is not enough; test mapping, vibration, wireless mode and the actual game.", "Kopplung reicht nicht; Belegung, Vibration, Funkmodus und das echte Spiel testen."),
  entry("racing_wheel", "Racing wheel / pedals", "Lenkrad / Pedale", "Force feedback, calibration, profiles and vendor firmware are separate requirements.", "Force Feedback, Kalibrierung, Profile und Hersteller-Firmware sind getrennte Anforderungen."),
  entry("special_usb", "Special USB device", "Spezielles USB-Gerät", "Record specialist, medical, measurement, licence-dongle or industrial devices without adding serial numbers.", "Spezial-, Medizin-, Mess-, Lizenz-Dongle- oder Industriegeräte ohne Seriennummern erfassen.")
];

export const hardwareClassById = new Map(
  hardwareClasses.map((item) => [item.id, item])
);

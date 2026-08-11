import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { createDefaultPassport } from "./domain/defaults";
import { applyHardwareSnapshot } from "./hardware/integration";
import { makeWindowsExeSnapshot, makeWindowsSnapshot } from "./test/hardwareFixtures";
import { migrationPassportSchema } from "./passport/schema";

const PASSPORT_V3_KEY = "linux-migration-companion:passport:v3";
const PASSPORT_V2_KEY = "linux-migration-companion:passport:v2";
const PASSPORT_V1_KEY = "linux-migration-companion:passport:v1";

function jsonFile(name: string, contents: string): File {
  const file = new File([contents], name, { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => contents });
  return file;
}

function storePopulatedPassport(locale: "en" | "de" = "en") {
  const passport = createDefaultPassport();
  passport.locale = locale;
  passport.selectedDistroId = "linux-mint-cinnamon";
  passport.comparisonDistroIds = ["linux-mint-cinnamon", "zorin-os"];
  passport.softwareSelections = { photoshop: "essential" };
  passport.hardware.evidence.wifi = {
    state: "live_verified",
    required: true,
    details: "Tested on the target laptop"
  };
  passport.hardware.snapshot = {
    acquisition: "file_import",
    acquiredAt: "2026-08-11T12:01:00.000Z",
    snapshot: makeWindowsSnapshot()
  };
  passport.liveTests.wifi = "works";
  passport.dataMigration.documents = {
    importance: "essential",
    method: "copy",
    notes: "Backup checked"
  };
  passport.mediaProgress.download = true;
  window.localStorage.setItem(PASSPORT_V3_KEY, JSON.stringify(passport));
  return passport;
}

describe("release-candidate application flow", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
    document.documentElement.lang = "en";
  });

  it("opens with the local-only boundary and canonical root title", async () => {
    render(<App />);
    expect(screen.getByText("Runs locally in your browser. No account. No tracking.")).toBeInTheDocument();
    expect(screen.getByText("Web app: no disk writes or command execution.")).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe(
        "Linux Migration Companion | Windows-to-Linux Planning"
      )
    );
  });

  it("opens reset confirmation without changing progress on the first click", async () => {
    const user = userEvent.setup();
    const passport = storePopulatedPassport();
    window.history.replaceState({}, "", "/?step=data");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start over" }));

    expect(
      screen.getByRole("dialog", { name: "Start over?" })
    ).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "{}").selectedDistroId
    ).toBe(passport.selectedDistroId);
    expect(new URLSearchParams(window.location.search).get("step")).toBe("data");
  });

  it("cancels reset without changing state and returns focus to Start over", async () => {
    const user = userEvent.setup();
    storePopulatedPassport();
    window.history.replaceState({}, "", "/?step=data");
    render(<App />);
    const startOver = screen.getByRole("button", { name: "Start over" });
    const before = window.localStorage.getItem(PASSPORT_V3_KEY);

    await user.click(startOver);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(PASSPORT_V3_KEY)).toBe(before);
    expect(screen.getByRole("heading", { name: "Plan the data, not just the operating system" })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("step")).toBe("data");
    await waitFor(() => expect(startOver).toHaveFocus());
  });

  it("confirms a schema-valid clean reset and preserves unrelated storage and locale", async () => {
    const user = userEvent.setup();
    storePopulatedPassport("de");
    window.history.replaceState({}, "", "/?step=data");
    render(<App />);
    window.localStorage.setItem(PASSPORT_V1_KEY, "legacy-owned-data");
    window.localStorage.setItem(PASSPORT_V2_KEY, "legacy-v2-owned-data");
    window.localStorage.setItem("another-app:setting", "keep-me");

    await user.click(screen.getByRole("button", { name: "Neu beginnen" }));
    await user.click(screen.getByRole("button", { name: "Alles zurücksetzen" }));

    expect(
      await screen.findByRole("heading", {
        name: "Könnte Linux Windows für dich realistisch ersetzen?"
      })
    ).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("step")).toBeNull();
    expect(window.localStorage.getItem(PASSPORT_V1_KEY)).toBeNull();
    expect(window.localStorage.getItem(PASSPORT_V2_KEY)).toBeNull();
    expect(window.localStorage.getItem("another-app:setting")).toBe("keep-me");

    await waitFor(() => {
      const parsed = migrationPassportSchema.parse(
        JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "")
      );
      expect(parsed.locale).toBe("de");
      expect(parsed.selectedDistroId).toBeNull();
      expect(parsed.comparisonDistroIds).toEqual([]);
      expect(parsed.softwareSelections).toEqual({});
      expect(parsed.dataMigration).toEqual({});
      expect(Object.values(parsed.liveTests).every((state) => state === "not_tested")).toBe(true);
      expect(Object.values(parsed.hardware.evidence).every((item) => item.state === "unknown")).toBe(true);
      expect(parsed.hardware.snapshot).toBeNull();
      expect(Object.values(parsed.mediaProgress).every((state) => state === false)).toBe(true);
    });
  });

  it("provides localized reset copy, trapped focus and Escape cancellation", async () => {
    const user = userEvent.setup();
    render(<App />);
    const startOver = screen.getByRole("button", { name: "Start over" });

    await user.click(startOver);
    const dialog = screen.getByRole("dialog", { name: "Start over?" });
    expect(within(dialog).getByText("Advisor answers and selected comparisons")).toBeInTheDocument();
    expect(within(dialog).getByText("Export the Passport first if you want to keep this evidence.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Reset everything" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "DE" }));
    await user.click(screen.getByRole("button", { name: "Neu beginnen" }));
    const germanDialog = screen.getByRole("dialog", { name: "Neu beginnen?" });
    expect(within(germanDialog).getByRole("button", { name: "Abbrechen" })).toBeInTheDocument();
    expect(within(germanDialog).getByRole("button", { name: "Alles zurücksetzen" })).toBeInTheDocument();
    expect(within(germanDialog).getByText("Lokaler Status des Migration Passport")).toBeInTheDocument();
  });

  it("uses the migration-path identity and presents authorship without the old LM mark", () => {
    render(<App />);
    expect(document.querySelector(".brand-mark .brand-arrow")).toBeInTheDocument();
    expect(screen.queryByText(/^LM$/)).not.toBeInTheDocument();
    expect(screen.getByText("© 2026 Dennis Hilk")).toBeInTheDocument();
    expect(screen.getByText("Licensed under the MIT License")).toBeInTheDocument();
  });

  it("switches the core interface to German and persists the locale locally", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "DE" }));
    expect(screen.getByRole("heading", { name: "Könnte Linux Windows für dich realistisch ersetzen?" })).toBeInTheDocument();
    await waitFor(() => {
      const saved = window.localStorage.getItem(PASSPORT_V3_KEY);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved ?? "{}").locale).toBe("de");
    });
  });

  it("produces explained results without displaying a percentage", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Hardware and migration/ }));
    await user.click(screen.getByRole("button", { name: "Analyze my fit" }));
    expect(await screen.findByRole("heading", { name: "Your explained matches" })).toBeInTheDocument();
    expect(screen.getAllByText("Linux Mint").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });

  it("navigates directly to the 90-workflow software assessment", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Software/ }));
    expect(screen.getByRole("heading", { name: "What software genuinely has to move?" })).toBeInTheDocument();
    expect(screen.getByText("90 / 90 curated workflows")).toBeInTheDocument();
  });

  it("exposes the complete ten-step journey without a hidden route", () => {
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    const numberedJourney = within(navigation).getByRole("list");
    expect(within(numberedJourney).getAllByRole("button")).toHaveLength(10);
    expect(within(navigation).getAllByRole("button")).toHaveLength(11);
    expect(within(navigation).getByRole("button", { name: /Compare/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: /Readiness/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: /Data plan/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "Support" })).toBeInTheDocument();
  });

  it("opens voluntary support outside the numbered journey with verified safe links", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    const support = within(navigation).getByRole("button", { name: "Support" });
    support.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("heading", {
        name: "Did the Linux Migration Companion help you?"
      })
    ).toBeInTheDocument();
    expect(screen.getByText("The tool stays free, local-first and tracking-free.")).toBeInTheDocument();
    expect(screen.getByText(/entirely voluntary/)).toBeInTheDocument();
    const tea = screen.getByRole("link", {
      name: "Buy Dennis an East Frisian tea (opens in a new tab)"
    });
    expect(tea).toHaveAttribute("href", "https://buymeacoffee.com/dennishilk");
    expect(tea).toHaveAttribute("target", "_blank");
    expect(tea).toHaveAttribute("rel", "noopener noreferrer");
    expect(tea.querySelector(".support-button-icon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dennishilk.com/ })).toHaveAttribute(
      "href",
      "https://dennishilk.com/"
    );
    expect(screen.getByRole("link", { name: /GitHub repository/ })).toHaveAttribute(
      "href",
      "https://github.com/dennishilk/linux-migration-companion"
    );
    expect(new URLSearchParams(window.location.search).get("step")).toBeNull();
    expect(within(within(navigation).getByRole("list")).getAllByRole("button")).toHaveLength(10);
    await waitFor(() => expect(document.getElementById("main-content")).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "DE" }));
    expect(screen.getByRole("heading", { name: "Hilft dir der Linux Migration Companion?" })).toBeInTheDocument();
    expect(screen.getByText("Das Tool bleibt kostenlos, lokal und ohne Tracking.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ostfriesischen Tee ausgeben/ })).toHaveTextContent("Tee ausgeben");
  });

  it("limits side-by-side distro comparison to three choices", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Compare/ }));
    await user.click(screen.getByRole("checkbox", { name: /Linux Mint/ }));
    await user.click(screen.getByRole("checkbox", { name: /Zorin OS/ }));
    await user.click(screen.getByRole("checkbox", { name: /Ubuntu/ }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Fedora KDE/ })).toBeDisabled();
  });

  it("shows insufficient evidence rather than a false ready result", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Readiness/ }));
    expect(screen.getAllByText("INSUFFICIENT EVIDENCE").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });

  it("links a successful live test to hardware evidence", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Live test/ }));
    const wifiRow = screen.getByRole("heading", { name: "Wi-Fi" }).closest("article");
    expect(wifiRow).not.toBeNull();
    await user.click(within(wifiRow as HTMLElement).getByRole("button", { name: "Works" }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "{}");
      expect(saved.hardware.evidence.wifi.state).toBe("live_verified");
    });
  });

  it("moves detected required Wi-Fi through live pass, rollback and problem conservatively", async () => {
    const user = userEvent.setup();
    const passport = createDefaultPassport();
    passport.hardware = applyHardwareSnapshot(passport.hardware, {
      acquisition: "file_import",
      acquiredAt: "2026-08-11T12:01:00.000Z",
      snapshot: makeWindowsSnapshot()
    });
    passport.hardware.evidence.wifi.required = true;
    window.localStorage.setItem(PASSPORT_V3_KEY, JSON.stringify(passport));
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Live test/ }));
    const wifiRow = screen.getByRole("heading", { name: "Wi-Fi" }).closest("article");
    expect(wifiRow).not.toBeNull();

    await user.click(within(wifiRow as HTMLElement).getByRole("button", { name: "Works" }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "{}");
      expect(saved.liveTests.wifi).toBe("works");
      expect(saved.hardware.evidence.wifi.state).toBe("live_verified");
    });

    await user.click(within(wifiRow as HTMLElement).getByRole("button", { name: "Not tested" }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "{}");
      expect(saved.hardware.evidence.wifi.state).toBe("known_fact");
    });

    await user.click(within(wifiRow as HTMLElement).getByRole("button", { name: "Issue" }));
    await user.click(within(navigation).getByRole("button", { name: /Readiness/ }));
    expect(screen.getAllByText("BLOCKED").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: "Migration is currently blocked" })
    ).toBeInTheDocument();
  });

  it("records a data migration method without performing a migration", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Data plan/ }));
    const documentsCard = screen.getByRole("heading", { name: "Documents" }).closest("article");
    expect(documentsCard).not.toBeNull();
    await user.click(within(documentsCard as HTMLElement).getByRole("button", { name: "Add as COPY" }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "{}");
      expect(saved.dataMigration.documents.method).toBe("copy");
    });
  });

  it("renders all 19 manual hardware evidence classes alongside optional snapshots", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    expect(screen.getByText(/deliberately limited browser report/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record browser facts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose snapshot JSON" })).toBeInTheDocument();
    const windowsDownload = screen.getByRole("link", {
      name: "Download Windows Hardware Snapshot executable"
    });
    expect(windowsDownload).toHaveAttribute(
      "href",
      "/collectors/windows/LinuxMigrationCompanion-HardwareSnapshot.exe"
    );
    const primaryWindowsPath = windowsDownload.closest(".collector-primary");
    expect(primaryWindowsPath).toHaveTextContent("portable, open-source and read-only");
    expect(primaryWindowsPath).toHaveTextContent("no installation or administrator rights");
    expect(primaryWindowsPath).toHaveTextContent("Detection is not Linux compatibility");
    expect(primaryWindowsPath).not.toHaveTextContent("PowerShell");
    expect(screen.getByText("Advanced / source / manual PowerShell method")).toBeInTheDocument();
    expect(screen.getByLabelText("Choose hardware snapshot JSON file")).toHaveAttribute(
      "tabindex",
      "-1"
    );
    expect(screen.getAllByText("Evidence state")).toHaveLength(19);
  });

  it("imports a Windows executable snapshot with the same conservative provenance behavior", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    await user.upload(
      screen.getByLabelText("Choose hardware snapshot JSON file"),
      jsonFile("windows-exe-hardware.json", JSON.stringify(makeWindowsExeSnapshot()))
    );

    expect(await screen.findByText(/Snapshot structure validated and imported/)).toBeInTheDocument();
    await waitFor(() => {
      const saved = migrationPassportSchema.parse(
        JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "")
      );
      expect(saved.hardware.snapshot?.snapshot.collector.id).toBe("windows-dotnet");
      expect(saved.hardware.evidence.wifi.state).toBe("known_fact");
      expect(saved.hardware.evidence.wifi.required).toBe(false);
      expect(saved.liveTests.wifi).toBe("not_tested");
    });
  });

  it("uses natural English punctuation in the affected evidence labels", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    expect(screen.getAllByText("UNKNOWN: not verified")).toHaveLength(19);
    expect(screen.getByRole("heading", { name: "Record what is known; leave the rest UNKNOWN" })).toBeInTheDocument();
    expect(screen.queryByText(/UNKNOWN — not verified/)).not.toBeInTheDocument();
  });

  it("imports detected hardware without requiring it or passing a live test", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    await user.upload(
      screen.getByLabelText("Choose hardware snapshot JSON file"),
      jsonFile("windows-hardware.json", JSON.stringify(makeWindowsSnapshot()))
    );

    expect(
      await screen.findByText(/Snapshot structure validated and imported/)
    ).toBeInTheDocument();
    expect(screen.getAllByText("SNAPSHOT DETECTED").length).toBeGreaterThan(3);
    expect(screen.queryByText(/LINUX COMPATIBLE/i)).not.toBeInTheDocument();

    await waitFor(() => {
      const saved = migrationPassportSchema.parse(
        JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "")
      );
      expect(saved.hardware.evidence.wifi.state).toBe("known_fact");
      expect(saved.hardware.evidence.hybrid_graphics.state).toBe("known_fact");
      expect(saved.hardware.evidence.wifi.required).toBe(false);
      expect(saved.liveTests.wifi).toBe("not_tested");
      expect(saved.hardware.snapshot?.snapshot.source).toBe("windows_collector");
    });
  });

  it("renders markup-like imported device names as text, never active HTML", async () => {
    const user = userEvent.setup();
    const snapshot = makeWindowsSnapshot();
    snapshot.facts[0].name = '<img src=x onerror="alert(1)"><script>bad()</script>';
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    await user.upload(
      screen.getByLabelText("Choose hardware snapshot JSON file"),
      jsonFile("inert.json", JSON.stringify(snapshot))
    );
    expect(await screen.findByText(/<img src=x onerror=/)).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
    expect(document.querySelector("img[src='x']")).toBeNull();
  });

  it("records a limited browser report with unavailable APIs and no device identity", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    await user.click(screen.getByRole("button", { name: "Record browser facts" }));
    expect(
      await screen.findByText(/Limited browser-reported facts recorded/)
    ).toBeInTheDocument();
    expect(screen.getByText("No device identity was exposed by this browser snapshot.")).toBeInTheDocument();
    const saved = migrationPassportSchema.parse(
      JSON.parse(window.localStorage.getItem(PASSPORT_V3_KEY) ?? "")
    );
    expect(saved.hardware.snapshot?.snapshot.source).toBe("browser_reported");
    expect(saved.hardware.snapshot?.snapshot.facts).toEqual([]);
    expect(Object.values(saved.hardware.evidence).every((item) => item.state === "unknown")).toBe(true);
  });

  it("provides complete German snapshot controls, limits and provenance copy", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "DE" }));
    const navigation = screen.getByLabelText("Migrationsweg");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    expect(screen.getByRole("heading", { name: "Hardware-Snapshot" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browser-Fakten erfassen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Snapshot-JSON auswählen" })).toBeInTheDocument();
    expect(screen.getByText(/Erkennung erfasst ausschließlich Hardware-Fakten/)).toBeInTheDocument();
    expect(screen.getByText(/Nicht erfasst:/)).toBeInTheDocument();
  });

  it("shows the complete explanatory contract in First Boot 2.0", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /First boot/ }));
    await user.click(screen.getByRole("button", { name: "EXPLAIN EACH STEP" }));
    expect(screen.getAllByText("WHAT?").length).toBeGreaterThan(1);
    expect(screen.getAllByText("RISK?").length).toBeGreaterThan(1);
    expect(screen.getAllByText("VERIFY SUCCESS").length).toBeGreaterThan(1);
    expect(screen.getAllByText("BACK OUT").length).toBeGreaterThan(1);
  });

  it("rejects a malformed Passport through the visible import workflow", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Passport/ }));
    const input = screen.getByLabelText("Choose Passport JSON file");
    await user.upload(input, jsonFile("broken.json", "{not-json"));
    expect(
      await screen.findByText("That file is not a valid Migration Passport.")
    ).toBeInTheDocument();
  });

  it("imports a valid Passport v3 and applies its local locale", async () => {
    const user = userEvent.setup();
    const imported = createDefaultPassport();
    imported.locale = "de";
    imported.selectedDistroId = "linux-mint-cinnamon";
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Passport/ }));
    const input = screen.getByLabelText("Choose Passport JSON file");
    await user.upload(
      input,
      jsonFile("passport-v3.json", JSON.stringify(imported))
    );
    expect(
      await screen.findByText("Passport wurde importiert und validiert.")
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("de");
  });

  it("keeps the media handoff non-destructive when no distro is selected", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /USB guide/ }));
    expect(screen.getByText("No distribution selected")).toBeInTheDocument();
    expect(screen.getByText("Installation boundary")).toBeInTheDocument();
    expect(screen.getByText(/This app never accesses the drive/)).toBeInTheDocument();
    expect(screen.getAllByText("Mark done")).toHaveLength(6);
  });

  it("supports stable direct section URLs and browser history state", async () => {
    window.history.replaceState({}, "", "/?step=data");
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Plan the data, not just the operating system" })).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe("Data plan | Linux Migration Companion")
    );
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Software/ }));
    expect(new URLSearchParams(window.location.search).get("step")).toBe("software");
    window.history.replaceState({}, "", "/?step=readiness");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(await screen.findByRole("heading", { name: "Can Windows safely stop being the proven path?" })).toBeInTheDocument();
  });
});

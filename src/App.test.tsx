import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { createDefaultPassport } from "./domain/defaults";
import { migrationPassportSchema } from "./passport/schema";

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
  passport.liveTests.wifi = "works";
  passport.dataMigration.documents = {
    importance: "essential",
    method: "copy",
    notes: "Backup checked"
  };
  passport.mediaProgress.download = true;
  window.localStorage.setItem(PASSPORT_V2_KEY, JSON.stringify(passport));
  return passport;
}

describe("release-candidate application flow", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
    document.documentElement.lang = "en";
  });

  it("opens with the local-only and non-destructive boundary visible", () => {
    render(<App />);
    expect(screen.getByText("Runs locally in your browser. No account. No tracking.")).toBeInTheDocument();
    expect(screen.getByText("No disk writes. No command execution.")).toBeInTheDocument();
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
      JSON.parse(window.localStorage.getItem(PASSPORT_V2_KEY) ?? "{}").selectedDistroId
    ).toBe(passport.selectedDistroId);
    expect(new URLSearchParams(window.location.search).get("step")).toBe("data");
  });

  it("cancels reset without changing state and returns focus to Start over", async () => {
    const user = userEvent.setup();
    storePopulatedPassport();
    window.history.replaceState({}, "", "/?step=data");
    render(<App />);
    const startOver = screen.getByRole("button", { name: "Start over" });
    const before = window.localStorage.getItem(PASSPORT_V2_KEY);

    await user.click(startOver);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(PASSPORT_V2_KEY)).toBe(before);
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
    expect(window.localStorage.getItem("another-app:setting")).toBe("keep-me");

    await waitFor(() => {
      const parsed = migrationPassportSchema.parse(
        JSON.parse(window.localStorage.getItem(PASSPORT_V2_KEY) ?? "")
      );
      expect(parsed.locale).toBe("de");
      expect(parsed.selectedDistroId).toBeNull();
      expect(parsed.comparisonDistroIds).toEqual([]);
      expect(parsed.softwareSelections).toEqual({});
      expect(parsed.dataMigration).toEqual({});
      expect(Object.values(parsed.liveTests).every((state) => state === "not_tested")).toBe(true);
      expect(Object.values(parsed.hardware.evidence).every((item) => item.state === "unknown")).toBe(true);
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
      const saved = window.localStorage.getItem("linux-migration-companion:passport:v2");
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
    expect(within(navigation).getAllByRole("button")).toHaveLength(10);
    expect(within(navigation).getByRole("button", { name: /Compare/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: /Readiness/ })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: /Data plan/ })).toBeInTheDocument();
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
      const saved = JSON.parse(window.localStorage.getItem("linux-migration-companion:passport:v2") ?? "{}");
      expect(saved.hardware.evidence.wifi.state).toBe("live_verified");
    });
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
      const saved = JSON.parse(window.localStorage.getItem("linux-migration-companion:passport:v2") ?? "{}");
      expect(saved.dataMigration.documents.method).toBe("copy");
    });
  });

  it("renders all 19 manual hardware evidence classes without claiming a scan", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Hardware/ }));
    expect(screen.getByText(/performs no fake hardware scan/)).toBeInTheDocument();
    expect(screen.getAllByText("Evidence state")).toHaveLength(19);
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

  it("imports a valid Passport v2 and applies its local locale", async () => {
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
      jsonFile("passport-v2.json", JSON.stringify(imported))
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
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Software/ }));
    expect(new URLSearchParams(window.location.search).get("step")).toBe("software");
    window.history.replaceState({}, "", "/?step=readiness");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(await screen.findByRole("heading", { name: "Can Windows safely stop being the proven path?" })).toBeInTheDocument();
  });
});

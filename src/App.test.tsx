import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

describe("Alpha application flow", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("opens with the local-only and non-destructive boundary visible", () => {
    render(<App />);
    expect(screen.getByText("Runs locally in your browser. No account. No tracking.")).toBeInTheDocument();
    expect(screen.getByText("No disk writes. No command execution.")).toBeInTheDocument();
  });

  it("switches the core interface to German and persists the locale locally", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "DE" }));
    expect(screen.getByRole("heading", { name: "Könnte Linux Windows für dich realistisch ersetzen?" })).toBeInTheDocument();
    await waitFor(() => {
      const saved = window.localStorage.getItem("linux-migration-companion:passport:v1");
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

  it("navigates directly to the 60-workflow software assessment", async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByLabelText("Migration journey");
    await user.click(within(navigation).getByRole("button", { name: /Software/ }));
    expect(screen.getByRole("heading", { name: "What software genuinely has to move?" })).toBeInTheDocument();
    expect(screen.getByText("60 / 60 curated workflows")).toBeInTheDocument();
  });
});

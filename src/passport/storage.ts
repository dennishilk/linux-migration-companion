import type { MigrationPassport } from "../domain/types";
import { migrationPassportSchema, parsePassportText } from "./schema";

const STORAGE_KEY = "linux-migration-companion:passport:v2";
const LEGACY_STORAGE_KEY = "linux-migration-companion:passport:v1";

export function loadPassport(): MigrationPassport | null {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return parsePassportText(raw);
  } catch {
    return null;
  }
}

export function savePassport(passport: MigrationPassport): void {
  const parsed = migrationPassportSchema.parse(passport);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function clearPassport(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

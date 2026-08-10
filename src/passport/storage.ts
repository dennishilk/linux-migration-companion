import type { MigrationPassport } from "../domain/types";
import { migrationPassportSchema } from "./schema";

const STORAGE_KEY = "linux-migration-companion:passport:v1";

export function loadPassport(): MigrationPassport | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = migrationPassportSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function savePassport(passport: MigrationPassport): void {
  const parsed = migrationPassportSchema.parse(passport);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}

export function clearPassport(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

import { DEFAULT_ANSWERS, createDefaultPassport } from "../domain/defaults";
import type { AdvisorAnswers, MigrationPassport } from "../domain/types";

export function makeAnswers(
  overrides: Partial<AdvisorAnswers> = {}
): AdvisorAnswers {
  return {
    ...DEFAULT_ANSWERS,
    gameLaunchers: [...DEFAULT_ANSWERS.gameLaunchers],
    ...overrides
  };
}

export function makePassport(): MigrationPassport {
  const passport = createDefaultPassport();
  return {
    ...passport,
    answers: makeAnswers(),
    softwareSelections: {},
    hardware: { ...passport.hardware },
    liveTests: { ...passport.liveTests },
    mediaProgress: { ...passport.mediaProgress }
  };
}

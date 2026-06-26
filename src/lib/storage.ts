import type { Attempt } from "../types";

const HISTORY_KEY = "kt-exam:attempts";

/** Reads the saved attempt history, newest first. Returns [] on any parse error. */
export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Attempt[];
  } catch {
    return [];
  }
}

/** Saves a new attempt to the front of the history and returns the updated list. */
export function saveAttempt(attempt: Attempt): Attempt[] {
  const attempts = [attempt, ...loadAttempts()];
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(attempts));
  } catch {
    // Storage full or unavailable — keep going without persisting.
  }
  return attempts;
}

export function getAttempt(id: string): Attempt | undefined {
  return loadAttempts().find((a) => a.id === id);
}

export function clearAttempts(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

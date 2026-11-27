import { readJson, writeJson } from "./storage";
import { CelebrationEffect, celebrationEffects } from "./Celebration";
import { TidyHistoryEntry, TidyRun, TidyTask } from "./tidyModel";

const SAVED_TASKS_KEY = "getting-ready/tidy-library";
const REMOVED_TASKS_KEY = "getting-ready/tidy-removed";
const RUN_KEY = "getting-ready/tidy-run";
const HISTORY_KEY = "getting-ready/tidy-history";
const CELEBRATION_KEY = "getting-ready/tidy-celebration";
const HISTORY_LIMIT = 50;

const readArray = <T>(key: string): T[] => {
  const stored = readJson<T[]>(key);
  return Array.isArray(stored) ? stored : [];
};

const sameTask = (a: TidyTask, b: TidyTask) =>
  a.name === b.name &&
  a.emoji === b.emoji &&
  a.kind === b.kind &&
  a.seconds === b.seconds;

export const loadTidyLibrary = (defaults: TidyTask[]): TidyTask[] => {
  const saved = readArray<TidyTask>(SAVED_TASKS_KEY);
  const removed = new Set(readArray<string>(REMOVED_TASKS_KEY));
  const defaultIds = new Set(defaults.map((task) => task.id));
  return [
    ...defaults.map((d) => saved.find((task) => task.id === d.id) ?? d),
    ...saved.filter((task) => !defaultIds.has(task.id)),
  ].filter((task) => !removed.has(task.id));
};

export const saveTidyLibrary = (library: TidyTask[], defaults: TidyTask[]) => {
  writeJson(
    SAVED_TASKS_KEY,
    library.filter((task) => {
      const original = defaults.find((d) => d.id === task.id);
      return !original || !sameTask(original, task);
    }),
  );
  writeJson(
    REMOVED_TASKS_KEY,
    defaults
      .filter((d) => !library.some((task) => task.id === d.id))
      .map((d) => d.id),
  );
};

export const loadTidyRun = (): TidyRun | undefined => {
  const stored = readJson<TidyRun>(RUN_KEY);
  return stored && Array.isArray(stored.taskIds) ? stored : undefined;
};

export const saveTidyRun = (run: TidyRun) => writeJson(RUN_KEY, run);

export type CelebrationChoice = CelebrationEffect | "random";

export const loadTidyCelebration = (): CelebrationChoice => {
  const stored = readJson<CelebrationChoice>(CELEBRATION_KEY);
  return stored && celebrationEffects.includes(stored as CelebrationEffect)
    ? stored
    : "random";
};

export const saveTidyCelebration = (choice: CelebrationChoice) =>
  writeJson(CELEBRATION_KEY, choice);

export const loadTidyHistory = (): TidyHistoryEntry[] =>
  readArray<TidyHistoryEntry>(HISTORY_KEY);

export const recordTidyHistory = (
  history: TidyHistoryEntry[],
  entry: TidyHistoryEntry,
): TidyHistoryEntry[] => {
  const next = [
    entry,
    ...history.filter((e) => e.startedAt !== entry.startedAt),
  ].slice(0, HISTORY_LIMIT);
  writeJson(HISTORY_KEY, next);
  return next;
};

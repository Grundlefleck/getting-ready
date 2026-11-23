import { readJson, writeJson } from "./storage";
import { TidyHistoryEntry, TidyRun, TidyTask } from "./tidyModel";

const CUSTOM_TASKS_KEY = "getting-ready/tidy-library";
const RUN_KEY = "getting-ready/tidy-run";
const HISTORY_KEY = "getting-ready/tidy-history";
const HISTORY_LIMIT = 50;

export const loadTidyLibrary = (defaults: TidyTask[]): TidyTask[] => {
  const stored = readJson<TidyTask[]>(CUSTOM_TASKS_KEY);
  if (!Array.isArray(stored)) {
    return defaults;
  }
  const defaultIds = new Set(defaults.map((task) => task.id));
  return [...defaults, ...stored.filter((task) => !defaultIds.has(task.id))];
};

export const saveCustomTidyTasks = (
  library: TidyTask[],
  defaults: TidyTask[],
) =>
  writeJson(
    CUSTOM_TASKS_KEY,
    library.filter((task) => !defaults.some((d) => d.id === task.id)),
  );

export const loadTidyRun = (): TidyRun | undefined => {
  const stored = readJson<TidyRun>(RUN_KEY);
  return stored && Array.isArray(stored.taskIds) ? stored : undefined;
};

export const saveTidyRun = (run: TidyRun) => writeJson(RUN_KEY, run);

export const loadTidyHistory = (): TidyHistoryEntry[] => {
  const stored = readJson<TidyHistoryEntry[]>(HISTORY_KEY);
  return Array.isArray(stored) ? stored : [];
};

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

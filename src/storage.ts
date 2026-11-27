import {
  ChildTaskConfig,
  initialiseTaskCompletionStatus,
  TaskCompletionStatus,
} from "./model";
import { TickTimes } from "./morningBadges";

const STORAGE_KEY = "getting-ready/task-model-state";

export const readJson = <T>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
};

export const writeJson = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
};

interface StoredDay {
  date?: string;
  taskCompletionStatus?: TaskCompletionStatus;
  tickTimes?: TickTimes;
}

export const loadTaskCompletionStatus = (
  config: ChildTaskConfig[],
  dayKey: string,
): TaskCompletionStatus | undefined => {
  const stored = readJson<StoredDay>(STORAGE_KEY);
  if (stored?.date !== dayKey) {
    return undefined;
  }
  const status = initialiseTaskCompletionStatus(config);
  for (const child of config) {
    for (const task of child.tasks) {
      if (stored.taskCompletionStatus?.[child.name]?.[task.id] === true) {
        status[child.name][task.id] = true;
      }
    }
  }
  return status;
};

export const loadTickTimes = (dayKey: string): TickTimes => {
  const stored = readJson<StoredDay>(STORAGE_KEY);
  return stored?.date === dayKey && stored.tickTimes ? stored.tickTimes : {};
};

export const saveTaskCompletionStatus = (
  taskCompletionStatus: TaskCompletionStatus,
  dayKey: string,
  tickTimes: TickTimes = {},
): void =>
  writeJson(STORAGE_KEY, { date: dayKey, taskCompletionStatus, tickTimes });

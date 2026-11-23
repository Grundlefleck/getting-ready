import {
  ChildTaskConfig,
  initialiseTaskCompletionStatus,
  TaskCompletionStatus,
} from "./model";

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

export const loadTaskCompletionStatus = (
  config: ChildTaskConfig[],
  dayKey: string,
): TaskCompletionStatus | undefined => {
  const stored = readJson<{
    date?: string;
    taskCompletionStatus?: TaskCompletionStatus;
  }>(STORAGE_KEY);
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

export const saveTaskCompletionStatus = (
  taskCompletionStatus: TaskCompletionStatus,
  dayKey: string,
): void => writeJson(STORAGE_KEY, { date: dayKey, taskCompletionStatus });

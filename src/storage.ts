import {
  ChildTaskConfig,
  initialiseTaskCompletionStatus,
  TaskCompletionStatus,
} from "./model";

const STORAGE_KEY = "getting-ready/task-model-state";

export const loadTaskCompletionStatus = (
  config: ChildTaskConfig[],
  dayKey: string,
): TaskCompletionStatus | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const stored = JSON.parse(raw);
    if (stored.date !== dayKey) {
      return undefined;
    }
    const status = initialiseTaskCompletionStatus(config);
    for (const child of config) {
      for (const task of child.tasks) {
        if (stored.taskCompletionStatus?.[child.name]?.[task.name] === true) {
          status[child.name][task.name] = true;
        }
      }
    }
    return status;
  } catch {
    return undefined;
  }
};

export const saveTaskCompletionStatus = (
  taskCompletionStatus: TaskCompletionStatus,
  dayKey: string,
): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: dayKey, taskCompletionStatus }),
    );
  } catch {
    return;
  }
};

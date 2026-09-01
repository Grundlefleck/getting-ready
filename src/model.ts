export type HHmm = `${number}${number}:${number}${number}`;

export interface TaskConfig {
  id: string;
  name: string;
  duration: number;
  emoji: string;
}

export type Activity = "pe" | "outdoor";
export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

interface ChildTaskConfig {
  name: string;
  startTime: HHmm;
  tasks: TaskConfig[];
  colorClass: string;
  activities?: Partial<Record<Weekday, Activity[]>>;
}

const WEEKDAY_BY_DAY_INDEX: (Weekday | undefined)[] = [
  undefined,
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  undefined,
];

export const activitiesFor = (
  child: ChildTaskConfig,
  date: Date,
): Activity[] => {
  const weekday = WEEKDAY_BY_DAY_INDEX[date.getDay()];
  return weekday ? (child.activities?.[weekday] ?? []) : [];
};

export interface TaskWindow {
  start: Date;
  end: Date;
}

export const parseHHmm = (time: HHmm, reference: Date): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(reference);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export const taskWindows = (
  child: ChildTaskConfig,
  reference: Date,
): TaskWindow[] => {
  let cursor = parseHHmm(child.startTime, reference);
  return child.tasks.map((task) => {
    const start = cursor;
    const end = new Date(start.getTime() + task.duration * 60_000);
    cursor = end;
    return { start, end };
  });
};

export const elapsedFraction = (window: TaskWindow, now: Date): number => {
  const total = window.end.getTime() - window.start.getTime();
  if (total <= 0) {
    return 1;
  }
  const elapsed = now.getTime() - window.start.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
};

export const minutesRemaining = (child: ChildTaskConfig, now: Date): number => {
  const windows = taskWindows(child, now);
  const end = windows[windows.length - 1].end;
  return Math.ceil((end.getTime() - now.getTime()) / 60_000);
};

export type TaskCompletionStatus = Record<string, Record<string, boolean>>;
export const initialiseTaskCompletionStatus = (config: ChildTaskConfig[]) => {
  const status: TaskCompletionStatus = {};
  config.forEach((config) => {
    const incompleteTasks = config.tasks.reduce(
      (accum, task) => {
        accum[task.id] = false;
        return accum;
      },
      {} as Record<string, boolean>,
    );
    status[config.name] = incompleteTasks;
  });
  return status;
};

// Define the structure of the model state
export interface ModelState {
  config: ChildTaskConfig[];
  taskCompletionStatus: TaskCompletionStatus;
  lastUpdate: string;
}

type ModelOperation =
  | { type: "TaskClicked"; taskConfig: ChildTaskConfig; completed: TaskConfig }
  | { type: "TaskUnchecked"; taskConfig: ChildTaskConfig; task: TaskConfig }
  | { type: "TimedPassed"; currentTime: Date };

class TaskModel {
  private state: ModelState;

  constructor(initialState: ModelState) {
    this.state = initialState;
  }

  public applyOperation(operation: ModelOperation): void {
    switch (operation.type) {
      case "TaskClicked":
        this.state = TaskModel.withTaskCompletion(
          this.state,
          operation.taskConfig,
          operation.completed,
          true,
        );
        break;
      case "TaskUnchecked":
        this.state = TaskModel.withTaskCompletion(
          this.state,
          operation.taskConfig,
          operation.task,
          false,
        );
        break;
      case "TimedPassed":
        break;
      default:
        throw new Error(`Unhandled operation type: ${(operation as any).type}`);
    }
  }

  private static withTaskCompletion(
    state: ModelState,
    config: ChildTaskConfig,
    task: TaskConfig,
    completed: boolean,
  ): ModelState {
    return {
      ...state,
      taskCompletionStatus: {
        ...state.taskCompletionStatus,
        [config.name]: {
          ...state.taskCompletionStatus[config.name],
          [task.id]: completed,
        },
      },
    };
  }

  public getState(): ModelState {
    return this.state;
  }
}

export { TaskModel, type ChildTaskConfig };

export type HHmm = `${number}${number}:${number}${number}`;

export interface TaskConfig {
  name: string;
  duration: number;
}

interface ChildTaskConfig {
  name: string;
  startTime: HHmm;
  tasks: TaskConfig[];
  colorClass: string;
}

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
        accum[task.name] = false;
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
  | { type: "TimedPassed"; currentTime: Date };

class TaskModel {
  private state: ModelState;

  constructor(initialState: ModelState) {
    this.state = initialState;
  }

  public applyOperation(operation: ModelOperation): void {
    switch (operation.type) {
      case "TaskClicked":
        this.handleTaskClick(operation.taskConfig, operation.completed);
        break;
      case "TimedPassed":
        this.handleTimePassage(operation.currentTime);
        break;
      default:
        throw new Error(`Unhandled operation type: ${(operation as any).type}`);
    }
  }

  private handleTaskClick(
    config: ChildTaskConfig,
    taskCompleted: TaskConfig,
  ): void {
    this.state.taskCompletionStatus[config.name][taskCompleted.name] = true;
  }

  private handleTimePassage(currentTime: Date): void {
    const now = currentTime.getTime();
  }

  public getState(): ModelState {
    return this.state;
  }

  public startTime(): Date {
    const start = new Date();
    start.setHours(7, 45);
    return start;
  }
  endTime(): Date {
    const end = new Date();
    end.setHours(8, 55);
    return end;
  }
}

export { TaskModel, type ChildTaskConfig };

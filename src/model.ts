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

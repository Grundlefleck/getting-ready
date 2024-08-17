interface TaskConfig {
  name: string;
  expectedCompletionTime: Date;
}

interface ChildTaskConfig {
  name: string;
  tasks: TaskConfig[];
  colorClass: string;
}

// Define the structure of the model state
interface ModelState {
  children: ChildTaskConfig[];
  taskCompletionStatus: { [taskName: string]: boolean };
}

// Define operations that affect the model
type ModelOperation =
  | { type: "TaskClicked"; taskName: string }
  | { type: "TimedPassed"; currentTime: Date };

class TaskModel {
  private state: ModelState;

  constructor(initialState: ModelState) {
    this.state = initialState;
  }

  // Handle operations and update state
  public applyOperation(operation: ModelOperation): void {
    switch (operation.type) {
      case "TaskClicked":
        this.handleTaskClick(operation.taskName);
        break;
      case "TimedPassed":
        this.handleTimePassage(operation.currentTime);
        break;
      default:
        throw new Error(`Unhandled operation type: ${(operation as any).type}`);
    }
  }

  private handleTaskClick(taskName: string): void {
    this.state.taskCompletionStatus[taskName] = true;
  }

  private handleTimePassage(currentTime: Date): void {
    const now = currentTime.getTime();
    this.state.children.forEach((child) => {
      child.tasks.forEach((task) => {
        if (
          !this.state.taskCompletionStatus[task.name] &&
          now > task.expectedCompletionTime.getTime()
        ) {
          this.state.taskCompletionStatus[task.name] = false;
        }
      });
    });
  }

  public getState(): ModelState {
    return this.state;
  }
}

export { TaskModel, type ChildTaskConfig };

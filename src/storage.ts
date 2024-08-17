import { ChildTaskConfig } from "./model";

const STORAGE_KEY = "getting-ready/task-model-state";

// Define types for the model
export interface ModelState {
  children: ChildTaskConfig[];
  taskCompletionStatus: { [taskName: string]: boolean };
  lastUpdate: string; // ISO date string
}

export {};

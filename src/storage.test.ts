import { ChildTaskConfig } from "./model";
import {
  loadTaskCompletionStatus,
  saveTaskCompletionStatus,
} from "./storage";

const config: ChildTaskConfig[] = [
  {
    name: "Testy",
    startTime: "07:45",
    tasks: [
      { name: "Eat breakfast", emoji: "🥣", duration: 30 },
      { name: "Brush teeth", emoji: "🪥", duration: 3 },
    ],
    colorClass: "bg-red-600",
  },
];

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns undefined when nothing is stored", () => {
    expect(loadTaskCompletionStatus(config, "2026-09-01")).toBeUndefined();
  });

  it("round-trips completion status for the same day", () => {
    saveTaskCompletionStatus(
      { Testy: { "Eat breakfast": true, "Brush teeth": false } },
      "2026-09-01",
    );

    expect(loadTaskCompletionStatus(config, "2026-09-01")).toEqual({
      Testy: { "Eat breakfast": true, "Brush teeth": false },
    });
  });

  it("ignores state stored for a different day", () => {
    saveTaskCompletionStatus(
      { Testy: { "Eat breakfast": true, "Brush teeth": true } },
      "2026-09-01",
    );

    expect(loadTaskCompletionStatus(config, "2026-09-02")).toBeUndefined();
  });

  it("drops stored tasks that are no longer configured and defaults new ones", () => {
    saveTaskCompletionStatus(
      { Testy: { "Eat breakfast": true, "Wash face": true } },
      "2026-09-01",
    );

    expect(loadTaskCompletionStatus(config, "2026-09-01")).toEqual({
      Testy: { "Eat breakfast": true, "Brush teeth": false },
    });
  });

  it("survives corrupt stored data", () => {
    localStorage.setItem("getting-ready/task-model-state", "not json{");

    expect(loadTaskCompletionStatus(config, "2026-09-01")).toBeUndefined();
  });
});

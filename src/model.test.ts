import {
  activitiesFor,
  ChildTaskConfig,
  elapsedFraction,
  initialiseTaskCompletionStatus,
  minutesRemaining,
  parseHHmm,
  TaskModel,
  taskWindows,
} from "./model";

const child: ChildTaskConfig = {
  name: "Testy",
  startTime: "07:45",
  tasks: [
    { name: "Eat breakfast", duration: 30 },
    { name: "Brush teeth", duration: 3 },
    { name: "Get dressed", duration: 15 },
  ],
  colorClass: "bg-red-600",
};

const at = (time: string) => new Date(`2026-09-01T${time}:00`);

describe("task windows", () => {
  it("schedules each task after the cumulative durations of those before it", () => {
    const windows = taskWindows(child, at("07:45"));

    expect(windows).toEqual([
      { start: at("07:45"), end: at("08:15") },
      { start: at("08:15"), end: at("08:18") },
      { start: at("08:18"), end: at("08:33") },
    ]);
  });

  it("parses HH:mm relative to the reference date", () => {
    const parsed = parseHHmm("07:45", at("12:00"));
    expect(parsed).toEqual(at("07:45"));
  });
});

describe("elapsed fraction", () => {
  const window = { start: at("08:00"), end: at("08:30") };

  it("is 0 before the task starts", () => {
    expect(elapsedFraction(window, at("07:50"))).toBe(0);
  });

  it("is proportional while the task is in progress", () => {
    expect(elapsedFraction(window, at("08:15"))).toBe(0.5);
  });

  it("is capped at 1 after the task ends", () => {
    expect(elapsedFraction(window, at("09:00"))).toBe(1);
  });
});

describe("activities", () => {
  const peChild: ChildTaskConfig = {
    ...child,
    activities: { tuesday: ["pe"], thursday: ["pe", "outdoor"] },
  };

  it("lists the configured activities for that weekday", () => {
    expect(activitiesFor(peChild, new Date("2026-09-01T08:00:00"))).toEqual([
      "pe",
    ]);
    expect(activitiesFor(peChild, new Date("2026-09-03T08:00:00"))).toEqual([
      "pe",
      "outdoor",
    ]);
  });

  it("is empty on unconfigured days, weekends, and for children without activities", () => {
    expect(activitiesFor(peChild, new Date("2026-09-02T08:00:00"))).toEqual(
      [],
    );
    expect(activitiesFor(peChild, new Date("2026-09-05T08:00:00"))).toEqual(
      [],
    );
    expect(activitiesFor(child, new Date("2026-09-01T08:00:00"))).toEqual([]);
  });
});

describe("task model", () => {
  const otherChild: ChildTaskConfig = {
    ...child,
    name: "Other",
  };
  const buildModel = () =>
    new TaskModel({
      config: [child, otherChild],
      taskCompletionStatus: initialiseTaskCompletionStatus([
        child,
        otherChild,
      ]),
      lastUpdate: at("07:45").toISOString(),
    });

  it("marks a clicked task as complete for that child only", () => {
    const model = buildModel();

    model.applyOperation({
      type: "TaskClicked",
      taskConfig: child,
      completed: child.tasks[0],
    });

    const status = model.getState().taskCompletionStatus;
    expect(status[child.name]["Eat breakfast"]).toBe(true);
    expect(status[child.name]["Brush teeth"]).toBe(false);
    expect(status[otherChild.name]["Eat breakfast"]).toBe(false);
  });

  it("produces a new state on every operation instead of mutating", () => {
    const model = buildModel();
    const before = model.getState();

    model.applyOperation({
      type: "TaskClicked",
      taskConfig: child,
      completed: child.tasks[0],
    });
    const after = model.getState();

    expect(after).not.toBe(before);
    expect(after.taskCompletionStatus).not.toBe(before.taskCompletionStatus);
    expect(after.taskCompletionStatus[child.name]).not.toBe(
      before.taskCompletionStatus[child.name],
    );
    // the prior snapshot is untouched
    expect(before.taskCompletionStatus[child.name]["Eat breakfast"]).toBe(
      false,
    );
    // untouched children share the same branch
    expect(after.taskCompletionStatus[otherChild.name]).toBe(
      before.taskCompletionStatus[otherChild.name],
    );
  });
});

describe("minutes remaining", () => {
  it("counts down to the end of the child's last task", () => {
    // Last task ends 08:33
    expect(minutesRemaining(child, at("08:03"))).toBe(30);
  });

  it("rounds partial minutes up", () => {
    expect(minutesRemaining(child, new Date("2026-09-01T08:32:30"))).toBe(1);
  });

  it("goes to zero and below once the schedule is over", () => {
    expect(minutesRemaining(child, at("08:33"))).toBe(0);
    expect(minutesRemaining(child, at("08:40"))).toBeLessThan(0);
  });
});

import { Badge } from "./BadgeList";

export type TidyKind = "team" | "count" | "each";

export interface TidyTask {
  id: string;
  name: string;
  emoji: string;
  kind: TidyKind;
  seconds: number;
}

export interface TidyPreset {
  name: string;
  taskIds: string[];
}

export type TidyReward = "jar" | "monster";
export const tidyRewards: TidyReward[] = ["jar", "monster"];

export interface TidyRun {
  date: string;
  taskIds: string[];
  reward?: TidyReward;
  startedAt?: number;
  finishedAt?: number;
  tallies: Record<string, Record<string, number>>;
  closed: Record<string, boolean>;
}

export interface TidyContext {
  library: TidyTask[];
  children: string[];
}

export type TidyOperation =
  | { type: "Contributed"; taskId: string; child: string }
  | { type: "Withdrawn"; taskId: string; child: string }
  | { type: "Closed"; taskId: string }
  | { type: "JobsChosen"; taskIds: string[] };

const MARBLES_PER_TASK = 6;
const OPEN_COUNT_PROGRESS_PER_ITEM = 0.1;
const OPEN_COUNT_PROGRESS_CAP = 0.5;

export const newRun = (
  date: string,
  taskIds: string[],
  reward: TidyReward = "jar",
): TidyRun => ({
  date,
  taskIds,
  reward,
  tallies: {},
  closed: {},
});

export const activeTasks = (run: TidyRun, library: TidyTask[]): TidyTask[] =>
  run.taskIds
    .map((id) => library.find((task) => task.id === id))
    .filter((task): task is TidyTask => task !== undefined);

export const tallyOf = (run: TidyRun, taskId: string, child: string): number =>
  run.tallies[taskId]?.[child] ?? 0;

export const totalOf = (run: TidyRun, taskId: string): number =>
  Object.values(run.tallies[taskId] ?? {}).reduce((a, b) => a + b, 0);

export const progress = (
  run: TidyRun,
  task: TidyTask,
  children: string[],
): number => {
  switch (task.kind) {
    case "team":
      return run.closed[task.id] ? 1 : 0;
    case "each":
      return (
        children.filter((child) => tallyOf(run, task.id, child) > 0).length /
        children.length
      );
    case "count":
      return run.closed[task.id]
        ? 1
        : Math.min(
            OPEN_COUNT_PROGRESS_CAP,
            totalOf(run, task.id) * OPEN_COUNT_PROGRESS_PER_ITEM,
          );
  }
};

export const isDone = (run: TidyRun, task: TidyTask, children: string[]) =>
  progress(run, task, children) >= 1;

export const shares = (
  run: TidyRun,
  task: TidyTask,
  children: string[],
): Record<string, number> => {
  const result: Record<string, number> = {};
  children.forEach((child) => (result[child] = 0));
  const total = totalOf(run, task.id);
  const done = progress(run, task, children);
  if (total === 0 || done === 0) {
    return result;
  }
  children.forEach(
    (child) => (result[child] = (tallyOf(run, task.id, child) / total) * done),
  );
  return result;
};

export const credits = (
  run: TidyRun,
  library: TidyTask[],
  children: string[],
): Record<string, number> => {
  const result: Record<string, number> = {};
  children.forEach((child) => (result[child] = 0));
  activeTasks(run, library).forEach((task) => {
    const taskShares = shares(run, task, children);
    children.forEach((child) => (result[child] += taskShares[child]));
  });
  return result;
};

export const overallProgress = (
  run: TidyRun,
  library: TidyTask[],
  children: string[],
): number => {
  const tasks = activeTasks(run, library);
  if (tasks.length === 0) {
    return 0;
  }
  return (
    tasks.reduce((sum, task) => sum + progress(run, task, children), 0) /
    tasks.length
  );
};

export const marbles = (
  run: TidyRun,
  library: TidyTask[],
  children: string[],
): string[] => {
  const result: string[] = [];
  activeTasks(run, library).forEach((task) => {
    const taskShares = shares(run, task, children);
    const sum = Object.values(taskShares).reduce((a, b) => a + b, 0);
    const wanted = Math.round(progress(run, task, children) * MARBLES_PER_TASK);
    if (wanted === 0 || sum === 0) {
      return;
    }
    const allocation = children.map((child) => {
      const exact = (taskShares[child] / sum) * wanted;
      return { child, exact, count: Math.floor(exact) };
    });
    let remaining =
      wanted - allocation.reduce((total, entry) => total + entry.count, 0);
    [...allocation]
      .sort((a, b) => b.exact - b.count - (a.exact - a.count))
      .forEach((entry) => {
        if (remaining > 0 && entry.exact > entry.count) {
          entry.count++;
          remaining--;
        }
      });
    allocation.forEach(({ child, count }) => {
      for (let i = 0; i < count; i++) {
        result.push(child);
      }
    });
  });
  return result;
};

export const marbleCapacity = (run: TidyRun, library: TidyTask[]) =>
  activeTasks(run, library).length * MARBLES_PER_TASK;

export const elapsedSeconds = (run: TidyRun, now: number): number =>
  run.startedAt === undefined
    ? 0
    : Math.max(0, ((run.finishedAt ?? now) - run.startedAt) / 1000);

export const goalSeconds = (run: TidyRun, library: TidyTask[]): number =>
  activeTasks(run, library).reduce((sum, task) => sum + task.seconds, 0);

const withTally = (
  run: TidyRun,
  taskId: string,
  child: string,
  value: number,
): TidyRun => ({
  ...run,
  tallies: {
    ...run.tallies,
    [taskId]: { ...run.tallies[taskId], [child]: Math.max(0, value) },
  },
});

const settle = (run: TidyRun, ctx: TidyContext, now: number): TidyRun => {
  const tasks = activeTasks(run, ctx.library);
  const allDone =
    tasks.length > 0 && tasks.every((task) => isDone(run, task, ctx.children));
  if (allDone) {
    return run.finishedAt === undefined ? { ...run, finishedAt: now } : run;
  }
  return run.finishedAt === undefined ? run : { ...run, finishedAt: undefined };
};

export const applyTidyOperation = (
  run: TidyRun,
  operation: TidyOperation,
  ctx: TidyContext,
  now: number,
): TidyRun => {
  if (operation.type === "JobsChosen") {
    return settle({ ...run, taskIds: operation.taskIds }, ctx, now);
  }
  const task = ctx.library.find((t) => t.id === operation.taskId);
  if (!task) {
    return run;
  }
  switch (operation.type) {
    case "Contributed": {
      if (isDone(run, task, ctx.children)) {
        return run;
      }
      const tally = tallyOf(run, task.id, operation.child);
      const next = task.kind === "count" ? tally + 1 : tally > 0 ? 0 : 1;
      const started =
        run.startedAt === undefined ? { ...run, startedAt: now } : run;
      return settle(
        withTally(started, task.id, operation.child, next),
        ctx,
        now,
      );
    }
    case "Withdrawn": {
      const tally = tallyOf(run, task.id, operation.child);
      if (tally === 0) {
        return run;
      }
      let next = withTally(run, task.id, operation.child, tally - 1);
      if (totalOf(next, task.id) === 0 && next.closed[task.id]) {
        next = { ...next, closed: { ...next.closed, [task.id]: false } };
      }
      return settle(next, ctx, now);
    }
    case "Closed": {
      if (totalOf(run, task.id) === 0) {
        return run;
      }
      return settle(
        { ...run, closed: { ...run.closed, [task.id]: true } },
        ctx,
        now,
      );
    }
  }
};

export const runForDay = (
  stored: TidyRun | undefined,
  date: string,
  defaultTaskIds: string[],
  reward: TidyReward,
): TidyRun =>
  stored?.date === date
    ? stored
    : newRun(date, stored?.taskIds ?? defaultTaskIds, reward);

export interface TidyHistoryEntry {
  selection: string;
  startedAt: number;
  seconds: number;
}

export const selectionKey = (taskIds: string[]) =>
  [...taskIds].sort().join(",");

export const lastTimeFor = (
  history: TidyHistoryEntry[],
  run: TidyRun,
): number | undefined => {
  const key = selectionKey(run.taskIds);
  const previous = history
    .filter((entry) => entry.selection === key)
    .filter((entry) => entry.startedAt !== run.startedAt)
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  return previous?.seconds;
};

export const badges = (
  run: TidyRun,
  library: TidyTask[],
  children: string[],
): Badge[] => {
  const tasks = activeTasks(run, library);
  const childCredits = credits(run, library, children);
  const result: Badge[] = [];
  const awarded = new Set<string>();

  const mostJobs = [...children].sort(
    (a, b) => childCredits[b] - childCredits[a],
  )[0];
  result.push({
    child: mostJobs,
    title: "Most jobs",
    detail: `${childCredits[mostJobs].toFixed(1)} jobs' worth`,
  });
  awarded.add(mostJobs);

  const countTasks = tasks.filter((task) => task.kind === "count");
  const itemsCollected = (child: string) =>
    countTasks.reduce((sum, task) => sum + tallyOf(run, task.id, child), 0);
  const collector = children
    .filter((child) => !awarded.has(child))
    .sort((a, b) => itemsCollected(b) - itemsCollected(a))[0];
  if (collector && itemsCollected(collector) > 0) {
    result.push({
      child: collector,
      title: "Top collector",
      detail: `${itemsCollected(collector)} things picked up`,
    });
    awarded.add(collector);
  }

  children
    .filter((child) => !awarded.has(child))
    .forEach((child) => {
      const helped = tasks.filter(
        (task) => shares(run, task, children)[child] > 0,
      ).length;
      result.push({
        child,
        title: "Team player",
        detail: `helped with ${helped} job${helped === 1 ? "" : "s"}`,
      });
    });

  return result;
};

export const transition = (
  previous: TidyRun,
  next: TidyRun,
  library: TidyTask[],
  children: string[],
): { finishedTask?: TidyTask; historyEntry?: TidyHistoryEntry } => {
  const finishedTask = activeTasks(next, library).find(
    (task) => isDone(next, task, children) && !isDone(previous, task, children),
  );
  const runFinished =
    next.finishedAt !== undefined &&
    previous.finishedAt === undefined &&
    next.startedAt !== undefined;
  return {
    finishedTask,
    historyEntry: runFinished
      ? {
          selection: selectionKey(next.taskIds),
          startedAt: next.startedAt as number,
          seconds: elapsedSeconds(next, next.finishedAt as number),
        }
      : undefined,
  };
};

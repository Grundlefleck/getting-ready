import { format } from "date-fns";
import { Badge } from "./BadgeList";
import { ChildTaskConfig, taskWindows } from "./model";

export type TickTimes = Record<string, Record<string, number>>;

const clock = (millis: number) => format(millis, "HH:mm");

export const readyAt = (
  child: ChildTaskConfig,
  ticks: TickTimes,
): number | undefined => {
  const times = child.tasks.map((task) => ticks[child.name]?.[task.id]);
  return times.every((t): t is number => t !== undefined)
    ? Math.max(...times)
    : undefined;
};

const bestLead = (
  child: ChildTaskConfig,
  children: ChildTaskConfig[],
  ticks: TickTimes,
) => {
  let best:
    | { task: ChildTaskConfig["tasks"][number]; lead: number }
    | undefined;
  child.tasks.forEach((task) => {
    const mine = ticks[child.name]?.[task.id];
    const others = children
      .filter((other) => other !== child)
      .map((other) => ticks[other.name]?.[task.id]);
    if (mine === undefined || others.some((t) => t === undefined)) {
      return;
    }
    const lead = Math.min(...(others as number[])) - mine;
    if (lead > 0 && (!best || lead > best.lead)) {
      best = { task, lead };
    }
  });
  return best;
};

export const morningBadges = (
  children: ChildTaskConfig[],
  ticks: TickTimes,
  day: Date,
): Badge[] => {
  const badges: Badge[] = [];
  const awarded = (child: ChildTaskConfig) =>
    badges.some((badge) => badge.child === child.name);
  const finished = children
    .map((child) => ({ child, at: readyAt(child, ticks) }))
    .filter(
      (f): f is { child: ChildTaskConfig; at: number } => f.at !== undefined,
    )
    .sort((a, b) => a.at - b.at);

  const first = finished[0];
  if (first) {
    badges.push({
      child: first.child.name,
      title: "🐦 Early bird",
      detail: `first ready, at ${clock(first.at)}`,
    });
  }

  const ahead = finished
    .filter((f) => !awarded(f.child))
    .map((f) => {
      const windows = taskWindows(f.child, day);
      const end = windows[windows.length - 1].end.getTime();
      return { ...f, minutes: Math.floor((end - f.at) / 60_000) };
    })
    .sort((a, b) => b.minutes - a.minutes)[0];
  if (ahead && ahead.minutes >= 1) {
    badges.push({
      child: ahead.child.name,
      title: "⏱️ Beat the clock",
      detail: `${ahead.minutes} min ahead of schedule`,
    });
  }

  children
    .filter((child) => !awarded(child))
    .forEach((child) => {
      const lead = bestLead(child, children, ticks);
      const at = readyAt(child, ticks);
      badges.push(
        lead
          ? {
              child: child.name,
              title: `${lead.task.emoji} ${lead.task.name} champ`,
              detail: `first to finish ${lead.task.name.toLowerCase()}`,
            }
          : {
              child: child.name,
              title: "🌟 Ready to go",
              detail: at === undefined ? "all done!" : `ready at ${clock(at)}`,
            },
      );
    });

  return children.map(
    (child) => badges.find((badge) => badge.child === child.name) as Badge,
  );
};

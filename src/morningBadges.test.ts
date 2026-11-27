import { config } from "./config";
import { morningBadges, TickTimes } from "./morningBadges";

const day = new Date("2026-11-26T07:00:00");
const at = (hhmm: string) => new Date(`2026-11-26T${hhmm}:00`).getTime();

const allTasksAt = (hhmm: string, overrides: Record<string, string> = {}) =>
  Object.fromEntries(
    config[0].tasks.map((task) => [task.id, at(overrides[task.id] ?? hhmm)]),
  );

describe("morning badges", () => {
  it("gives every child one badge, based on when they finished", () => {
    const ticks: TickTimes = {
      Jacob: allTasksAt("08:20"),
      Calum: allTasksAt("08:10", { "shoes-on": "08:05" }),
      Dylan: allTasksAt("08:30", { "brush-teeth": "07:50" }),
    };

    expect(morningBadges(config, ticks, day)).toEqual([
      {
        child: "Jacob",
        title: "⏱️ Beat the clock",
        detail: "23 min ahead of schedule",
      },
      {
        child: "Calum",
        title: "🐦 Early bird",
        detail: "first ready, at 08:10",
      },
      {
        child: "Dylan",
        title: "🪥 Brush teeth champ",
        detail: "first to finish brush teeth",
      },
    ]);
  });

  it("falls back to a kind badge when there is nothing else to give", () => {
    const ticks: TickTimes = {
      Jacob: allTasksAt("08:50"),
      Calum: allTasksAt("08:50"),
      Dylan: allTasksAt("08:50"),
    };

    expect(morningBadges(config, ticks, day).map((b) => b.title)).toEqual([
      "🐦 Early bird",
      "🌟 Ready to go",
      "🌟 Ready to go",
    ]);
  });
});

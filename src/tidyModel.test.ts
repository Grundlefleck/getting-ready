import {
  applyTidyOperation,
  badges,
  credits,
  elapsedSeconds,
  lastTimeFor,
  marbles,
  newRun,
  overallProgress,
  progress,
  runForDay,
  TidyContext,
  TidyOperation,
  TidyRun,
  TidyTask,
  transition,
} from "./tidyModel";

const library: TidyTask[] = [
  { id: "hangers", name: "Hangers", emoji: "🪝", kind: "count", seconds: 30 },
  { id: "pyjamas", name: "Pyjamas", emoji: "🛏️", kind: "team", seconds: 15 },
  { id: "karate", name: "Karate", emoji: "🥋", kind: "each", seconds: 15 },
];
const ctx: TidyContext = { library, children: ["A", "B", "C"] };

const play = (run: TidyRun, ...ops: TidyOperation[]) =>
  ops.reduce((r, op, i) => applyTidyOperation(r, op, ctx, 1000 * (i + 1)), run);
const give = (taskId: string, child: string): TidyOperation => ({
  type: "Contributed",
  taskId,
  child,
});
const close = (taskId: string): TidyOperation => ({ type: "Closed", taskId });

const start = () => newRun("2026-11-19", ["hangers", "pyjamas", "karate"]);

describe("count jobs", () => {
  it("credit follows the tally once someone says that's all", () => {
    const run = play(
      start(),
      give("hangers", "A"),
      give("hangers", "A"),
      give("hangers", "A"),
      give("hangers", "B"),
      close("hangers"),
    );

    expect(progress(run, library[0], ctx.children)).toBe(1);
    expect(credits(run, library, ctx.children)).toEqual({
      A: 0.75,
      B: 0.25,
      C: 0,
    });
  });

  it("shows partial progress before the job is closed", () => {
    const run = play(start(), give("hangers", "A"), give("hangers", "B"));

    expect(progress(run, library[0], ctx.children)).toBeCloseTo(0.2);
    expect(marbles(run, library, ctx.children)).toEqual(["A"]);
  });

  it("cannot be closed with nothing counted", () => {
    const run = play(start(), close("hangers"));

    expect(progress(run, library[0], ctx.children)).toBe(0);
  });
});

describe("team jobs", () => {
  it("splits one job's credit between the helpers", () => {
    const run = play(
      start(),
      give("pyjamas", "A"),
      give("pyjamas", "C"),
      close("pyjamas"),
    );

    expect(credits(run, library, ctx.children)).toEqual({
      A: 0.5,
      B: 0,
      C: 0.5,
    });
  });

  it("tapping a helper again removes them before the job is done", () => {
    const run = play(start(), give("pyjamas", "A"), give("pyjamas", "A"));

    expect(run.tallies.pyjamas.A).toBe(0);
  });
});

describe("everyone's own jobs", () => {
  it("is done only once every child has ticked theirs", () => {
    const twoDone = play(start(), give("karate", "A"), give("karate", "B"));
    expect(progress(twoDone, library[2], ctx.children)).toBeCloseTo(2 / 3);

    const allDone = play(twoDone, give("karate", "C"));
    expect(progress(allDone, library[2], ctx.children)).toBe(1);
  });
});

describe("a whole run", () => {
  const finish = () =>
    play(
      start(),
      give("hangers", "B"),
      give("hangers", "B"),
      close("hangers"),
      give("pyjamas", "A"),
      close("pyjamas"),
      give("karate", "A"),
      give("karate", "B"),
      give("karate", "C"),
    );

  it("starts the clock on the first tap and stops it when everything is done", () => {
    const run = finish();

    expect(run.startedAt).toBe(1000);
    expect(run.finishedAt).toBe(8000);
    expect(elapsedSeconds(run, 99_000)).toBe(7);
    expect(overallProgress(run, library, ctx.children)).toBe(1);
  });

  it("fills the jar exactly when everything is done", () => {
    const jar = marbles(finish(), library, ctx.children);

    expect(jar).toHaveLength(18);
    expect(jar.filter((c) => c === "B")).toHaveLength(8);
  });

  it("reopens the run when a job is undone", () => {
    const run = applyTidyOperation(
      finish(),
      { type: "Withdrawn", taskId: "karate", child: "C" },
      ctx,
      9000,
    );

    expect(run.finishedAt).toBeUndefined();
  });

  it("gives every child a badge", () => {
    const result = badges(finish(), library, ctx.children);

    expect(result.map((b) => `${b.child}: ${b.title}`)).toEqual([
      "A: Most jobs",
      "B: Top collector",
      "C: Team player",
    ]);
  });
});

describe("last time", () => {
  it("compares against the previous run of the same jobs, not this one", () => {
    const run = { ...start(), startedAt: 500 };
    const history = [
      { selection: "hangers,karate,pyjamas", startedAt: 500, seconds: 60 },
      { selection: "hangers,karate,pyjamas", startedAt: 200, seconds: 312 },
      { selection: "hangers", startedAt: 300, seconds: 20 },
    ];

    expect(lastTimeFor(history, run)).toBe(312);
  });
});

describe("runForDay", () => {
  it("keeps today's run and starts tomorrow fresh with the same jobs", () => {
    const today = play(start(), give("karate", "A"));

    expect(runForDay(today, "2026-11-19", ["x"], "monster")).toBe(today);
    expect(runForDay(today, "2026-11-20", ["x"], "monster")).toEqual(
      newRun("2026-11-20", ["hangers", "pyjamas", "karate"], "monster"),
    );
    expect(runForDay(undefined, "2026-11-20", ["x"], "jar").taskIds).toEqual([
      "x",
    ]);
  });
});

describe("transition", () => {
  it("reports the job that just finished, and a history entry when the run ends", () => {
    const almost = play(
      start(),
      give("hangers", "B"),
      close("hangers"),
      give("pyjamas", "A"),
      close("pyjamas"),
      give("karate", "A"),
      give("karate", "B"),
    );
    const done = applyTidyOperation(almost, give("karate", "C"), ctx, 10_000);

    expect(transition(almost, done, library, ctx.children)).toEqual({
      finishedTask: library[2],
      historyEntry: {
        selection: "hangers,karate,pyjamas",
        startedAt: 1000,
        seconds: 9,
      },
    });
    expect(
      transition(
        start(),
        play(start(), give("hangers", "A")),
        library,
        ctx.children,
      ),
    ).toEqual({
      finishedTask: undefined,
      historyEntry: undefined,
    });
  });
});

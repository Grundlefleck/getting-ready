import React, { useEffect, useState } from "react";
import BadgeList from "./BadgeList";
import { colorOf, config } from "./config";
import { dateKey } from "./lunches";
import { overrideCurrentTime, useCurrentTime } from "./clock";
import CelebrationOverlay from "./Celebration";
import MarbleJar from "./MarbleJar";
import MessMonster from "./MessMonster";
import JobPicker from "./JobPicker";
import { useLongPress } from "./longPress";
import { defaultTidyLibrary, tidyPresets } from "./tidyConfig";
import {
  activeTasks,
  applyTidyOperation,
  badges,
  credits,
  elapsedSeconds,
  goalSeconds,
  isDone,
  lastTimeFor,
  marbleCapacity,
  marbles,
  newRun,
  overallProgress,
  runForDay,
  shares,
  tallyOf,
  TidyOperation,
  TidyReward,
  tidyRewards,
  TidyRun,
  TidyTask,
  totalOf,
  transition,
} from "./tidyModel";
import {
  CelebrationChoice,
  loadTidyCelebration,
  loadTidyHistory,
  loadTidyLibrary,
  loadTidyRun,
  recordTidyHistory,
  saveTidyCelebration,
  saveTidyLibrary,
  saveTidyRun,
} from "./tidyStorage";

const children = config.map((child) => child.name);

const TOAST_MILLIS = 2500;

const formatSeconds = (seconds: number) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const today = () => dateKey(overrideCurrentTime());
const nowMillis = () => overrideCurrentTime().getTime();
const randomReward = () =>
  tidyRewards[Math.floor(Math.random() * tidyRewards.length)];

const FaceButton = ({
  child,
  label,
  active,
  badge,
  onTap,
  onLongPress,
}: {
  child: string;
  label: string;
  active: boolean;
  badge?: string;
  onTap: () => void;
  onLongPress: () => void;
}) => {
  const longPress = useLongPress();

  return (
    <button
      aria-label={label}
      className={`relative flex-1 min-w-0 rounded-xl py-2 flex flex-col items-center font-extrabold text-blue-950 select-none ${colorOf(
        child,
      )} ${active ? "ring-4 ring-gray-800" : "opacity-50"}`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
      {...longPress(onTap, onLongPress)}
    >
      <span className="text-2xl leading-none">{child[0]}</span>
      <span className="text-xs">{child}</span>
      {badge && (
        <span className="absolute -top-2 -right-2 min-w-[1.6rem] h-[1.6rem] px-1 rounded-full bg-gray-800 text-white text-sm grid place-items-center">
          {badge}
        </span>
      )}
    </button>
  );
};

const jobStatus = (task: TidyTask, run: TidyRun, done: boolean) => {
  const total = totalOf(run, task.id);
  switch (task.kind) {
    case "count":
      return total > 0 ? `${total} so far` : "Count them!";
    case "each":
      return `${total} / ${children.length} done`;
    case "team":
      return done ? "Done!" : "Who helped?";
  }
};

const JobCard = ({
  task,
  run,
  onOperation,
}: {
  task: TidyTask;
  run: TidyRun;
  onOperation: (operation: TidyOperation) => void;
}) => {
  const done = isDone(run, task, children);
  const taskShares = shares(run, task, children);
  const canClose = !done && task.kind !== "each" && totalOf(run, task.id) > 0;

  return (
    <div
      className={`relative rounded-2xl shadow-md p-3 flex flex-col gap-2 ${
        done
          ? "bg-green-100 ring-4 ring-green-600 animate-[celebration-pop_0.5s_ease-out]"
          : "bg-white"
      }`}
    >
      {done && (
        <i className="fas fa-check text-green-600 text-2xl absolute top-2 right-3" />
      )}
      <div className="flex items-center gap-3">
        <span className="text-4xl leading-none">{task.emoji}</span>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-lg leading-tight text-blue-950">
            {task.name}
          </span>
          <span className="text-sm font-semibold text-gray-500">
            {jobStatus(task, run, done)}
          </span>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        {children.map((child) => {
          const tally = tallyOf(run, task.id, child);
          return (
            <FaceButton
              key={child}
              child={child}
              label={`${child}: ${task.name}`}
              active={task.kind === "count" || tally > 0}
              badge={
                task.kind === "count" && tally > 0 ? String(tally) : undefined
              }
              onTap={() =>
                onOperation({ type: "Contributed", taskId: task.id, child })
              }
              onLongPress={() =>
                onOperation({ type: "Withdrawn", taskId: task.id, child })
              }
            />
          );
        })}
      </div>
      {canClose && (
        <button
          className="rounded-xl bg-amber-400 text-amber-950 font-extrabold py-2"
          onClick={() => onOperation({ type: "Closed", taskId: task.id })}
        >
          {task.kind === "team" ? "Done!" : "That's all of them"}
        </button>
      )}
      <div className="mt-auto h-2 rounded-full bg-gray-200 overflow-hidden flex">
        {children.map((child) => (
          <span
            key={child}
            className={`${colorOf(child)} transition-all duration-500`}
            style={{ width: `${taskShares[child] * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

type Tone = "neutral" | "good" | "bad";
const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-blue-900",
  good: "bg-green-600 text-white",
  bad: "bg-red-600 text-white",
};

const Pill = ({ text, tone }: { text: string; tone: Tone }) => (
  <span
    className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap tabular-nums ${TONE_CLASSES[tone]}`}
  >
    {text}
  </span>
);

const TidyHeader = ({
  run,
  goal,
  lastTime,
  overall,
  jobsLeft,
  onEditJobs,
}: {
  run: TidyRun;
  goal: number;
  lastTime?: number;
  overall: number;
  jobsLeft: number;
  onEditJobs: () => void;
}) => {
  const elapsed = elapsedSeconds(run, useCurrentTime().getTime());
  const started = run.startedAt !== undefined;
  const finished = run.finishedAt !== undefined;
  const aheadOfLast =
    lastTime !== undefined && overall >= Math.min(1, elapsed / lastTime);
  const toneFor = (good: boolean): Tone =>
    !started ? "neutral" : good ? "good" : "bad";
  const lastTimeLabel = !started
    ? "Last time"
    : aheadOfLast
      ? "Ahead of last time"
      : "Behind last time";

  return (
    <div className="flex-shrink-0 bg-white shadow flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="text-2xl font-extrabold text-blue-900">🧹 Tidy up</span>
      <span className="text-4xl font-extrabold tabular-nums text-blue-950 ml-2">
        {formatSeconds(elapsed)}
      </span>
      {goal > 0 && (
        <Pill
          text={`Goal ${formatSeconds(goal)}`}
          tone={toneFor(elapsed <= goal)}
        />
      )}
      {lastTime !== undefined && (
        <Pill
          text={`${lastTimeLabel} ${formatSeconds(lastTime)}`}
          tone={toneFor(aheadOfLast)}
        />
      )}
      <span className="text-gray-500 font-semibold">
        {finished
          ? "All tidy!"
          : started
            ? `${jobsLeft} job${jobsLeft === 1 ? "" : "s"} left`
            : "Tap your face on a job to start the clock"}
      </span>
      <button
        className="ml-auto px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold whitespace-nowrap"
        onClick={onEditJobs}
      >
        ✏️ Jobs
      </button>
    </div>
  );
};

const TidyApp: React.FC = () => {
  const [library, setLibrary] = useState(() =>
    loadTidyLibrary(defaultTidyLibrary),
  );
  const [run, setRun] = useState<TidyRun>(() =>
    runForDay(loadTidyRun(), today(), tidyPresets[0].taskIds, randomReward()),
  );
  const [history, setHistory] = useState(loadTidyHistory);
  const [showPicker, setShowPicker] = useState(
    () => activeTasks(run, library).length === 0,
  );
  const [celebrating, setCelebrating] = useState(false);
  const [celebration, setCelebration] = useState(loadTidyCelebration);
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string }>();

  const tasks = activeTasks(run, library);
  const goal = goalSeconds(run, library);
  const lastTime = lastTimeFor(history, run);
  const overall = overallProgress(run, library, children);
  const childCredits = credits(run, library, children);
  const jobsLeft = tasks.filter((t) => !isDone(run, t, children)).length;
  const finished = run.finishedAt !== undefined;
  const finalSeconds = elapsedSeconds(run, run.finishedAt ?? 0);
  const reward = run.reward ?? "jar";
  const earned = marbles(run, library, children);

  const commit = (next: TidyRun, nextLibrary = library) => {
    if (next === run) {
      return;
    }
    const { finishedTask, historyEntry } = transition(
      run,
      next,
      nextLibrary,
      children,
    );
    if (finishedTask) {
      setToast({
        id: Date.now(),
        text: `${finishedTask.emoji} ${finishedTask.name}: done!`,
      });
    }
    if (historyEntry) {
      setCelebrating(true);
      setSummaryDismissed(false);
      setHistory(recordTidyHistory(history, historyEntry));
    }
    setRun(next);
    saveTidyRun(next);
  };

  const apply = (operation: TidyOperation, nextLibrary = library) =>
    commit(
      applyTidyOperation(
        run,
        operation,
        { library: nextLibrary, children },
        nowMillis(),
      ),
      nextLibrary,
    );

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(() => setToast(undefined), TOAST_MILLIS);
    return () => clearTimeout(timeout);
  }, [toast]);

  const changeLibrary = (nextLibrary: TidyTask[], taskIds: string[]) => {
    setLibrary(nextLibrary);
    saveTidyLibrary(nextLibrary, defaultTidyLibrary);
    apply({ type: "JobsChosen", taskIds }, nextLibrary);
  };

  const saveTask = (task: TidyTask) =>
    library.some((t) => t.id === task.id)
      ? changeLibrary(
          library.map((t) => (t.id === task.id ? task : t)),
          run.taskIds,
        )
      : changeLibrary([...library, task], [...run.taskIds, task.id]);

  const deleteTask = (taskId: string) =>
    changeLibrary(
      library.filter((t) => t.id !== taskId),
      run.taskIds.filter((id) => id !== taskId),
    );

  const chooseReward = (next: TidyReward) => commit({ ...run, reward: next });

  const chooseCelebration = (choice: CelebrationChoice) => {
    setCelebration(choice);
    saveTidyCelebration(choice);
  };

  const startFresh = () => commit(newRun(today(), run.taskIds, reward));

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <TidyHeader
        run={run}
        goal={goal}
        lastTime={lastTime}
        overall={overall}
        jobsLeft={jobsLeft}
        onEditJobs={() => setShowPicker(true)}
      />

      <div className="relative flex flex-1 min-h-0 gap-4 p-4">
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
            {tasks.map((task) => (
              <JobCard
                key={task.id}
                task={task}
                run={run}
                onOperation={(operation) => apply(operation)}
              />
            ))}
          </div>
        </div>

        <div className="w-1/3 max-w-sm flex flex-col gap-4 bg-white rounded-2xl shadow-lg p-4">
          <div className="text-center">
            <span className="text-5xl font-extrabold text-blue-950 tabular-nums">
              {Math.round(overall * 100)}%
            </span>
          </div>
          {reward === "monster" ? (
            <MessMonster progress={overall} hits={earned} colorOf={colorOf} />
          ) : (
            <MarbleJar
              marbles={earned}
              capacity={marbleCapacity(run, library)}
              colorOf={colorOf}
            />
          )}
          <div className="flex flex-col gap-2">
            {children.map((child) => (
              <div key={child} className="flex items-center gap-2 font-bold">
                <span className="w-16 text-blue-950">{child}</span>
                <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                  <span
                    className={`block h-full ${colorOf(child)} transition-all duration-500`}
                    style={{
                      width: `${tasks.length ? (childCredits[child] / tasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-10 text-right tabular-nums text-gray-600">
                  {childCredits[child].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {toast && (
          <div
            key={toast.id}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white font-extrabold px-5 py-2 rounded-full shadow-lg animate-[celebration-pop_0.4s_ease-out]"
          >
            {toast.text}
          </div>
        )}
      </div>

      {finished && !celebrating && !summaryDismissed && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-5 max-w-2xl w-full text-center">
            <span className="text-5xl font-extrabold text-blue-900">
              {lastTime !== undefined && finalSeconds < lastTime
                ? "New record! 🏆"
                : "All tidy! 🎉"}
            </span>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                [formatSeconds(finalSeconds), "this time"],
                [
                  formatSeconds(goal),
                  finalSeconds <= goal ? "goal ✓ beaten" : "goal",
                ],
                ...(lastTime !== undefined
                  ? [
                      [
                        formatSeconds(lastTime),
                        finalSeconds < lastTime
                          ? "last time ✓ beaten"
                          : "last time",
                      ],
                    ]
                  : []),
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="bg-gray-100 rounded-xl px-4 py-2 min-w-[8rem]"
                >
                  <div className="text-3xl font-extrabold tabular-nums">
                    {value}
                  </div>
                  <div className="text-sm text-gray-600">{label}</div>
                </div>
              ))}
            </div>
            <BadgeList badges={badges(run, library, children)} />
            <div className="flex gap-3">
              <button
                className="px-5 py-2 rounded-xl bg-amber-400 text-amber-950 font-extrabold"
                onClick={startFresh}
              >
                Go again
              </button>
              <button
                className="px-5 py-2 rounded-xl bg-gray-200 font-bold"
                onClick={() => setSummaryDismissed(true)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPicker && (
        <JobPicker
          library={library}
          selectedIds={run.taskIds}
          reward={reward}
          onSelect={(taskIds) => apply({ type: "JobsChosen", taskIds })}
          onSave={saveTask}
          onDelete={deleteTask}
          onReward={chooseReward}
          celebration={celebration}
          onCelebration={chooseCelebration}
          onStartFresh={startFresh}
          onClose={() => setShowPicker(false)}
        />
      )}

      {celebrating && (
        <CelebrationOverlay
          message="🎉 All tidy! 🎉"
          effect={celebration === "random" ? undefined : celebration}
          onDone={() => setCelebrating(false)}
        />
      )}
    </div>
  );
};

export default TidyApp;

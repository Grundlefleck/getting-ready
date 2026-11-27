import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  activitiesFor,
  ChildTaskConfig,
  elapsedFraction,
  initialiseTaskCompletionStatus,
  minutesRemaining,
  ModelState,
  TaskCompletionStatus,
  TaskConfig,
  TaskModel,
  taskWindows,
} from "./model";
import { config } from "./config";
import BadgeList from "./BadgeList";
import { morningBadges, readyAt, TickTimes } from "./morningBadges";
import ActivityTags from "./ActivityTags";
import LunchPanel from "./LunchPanel";
import WeekMenuPopup from "./WeekMenuPopup";
import { dateKey } from "./lunches";
import {
  loadTaskCompletionStatus,
  loadTickTimes,
  saveTaskCompletionStatus,
} from "./storage";
import { overrideCurrentTime, useCurrentTime } from "./clock";
import CelebrationOverlay from "./Celebration";
import { useLongPress } from "./longPress";

const StatusIcon = ({
  completed,
  overdue,
}: {
  completed: boolean;
  overdue: boolean;
}) => (
  <i
    className={`fas ${
      completed
        ? "fa-check text-green-600"
        : overdue
          ? "fa-hourglass-end text-red-600"
          : "fa-hourglass-half text-yellow-900"
    } absolute bottom-1 right-1`}
    style={{ fontSize: "clamp(0.9rem, 1.9vw, 1.9rem)" }}
  />
);

const CountdownChip = ({
  minutesLeft,
  allDone,
}: {
  minutesLeft: number;
  allDone: boolean;
}) => {
  if (allDone) {
    return (
      <span className="mt-2 px-3 py-1 rounded-full text-sm font-bold shadow bg-green-600 text-white">
        🎉 Ready!
      </span>
    );
  }
  return (
    <span
      className={`mt-2 px-3 py-1 rounded-full text-sm font-bold shadow ${
        minutesLeft > 0
          ? "bg-white text-blue-900"
          : "bg-red-600 text-white animate-pulse"
      }`}
    >
      {minutesLeft > 0 ? `🚪 ${minutesLeft} min to go` : "🚪 Time to go!"}
    </span>
  );
};

const initialModelState: ModelState = {
  config: config,
  taskCompletionStatus:
    loadTaskCompletionStatus(config, dateKey(overrideCurrentTime())) ??
    initialiseTaskCompletionStatus(config),
  lastUpdate: new Date().toISOString(),
};

const model = new TaskModel(initialModelState);

const App: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<TaskCompletionStatus>(
    model.getState().taskCompletionStatus,
  );
  const [tickTimes, setTickTimes] = useState<TickTimes>(() =>
    loadTickTimes(dateKey(overrideCurrentTime())),
  );
  const [showWeekMenu, setShowWeekMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [celebrationQueue, setCelebrationQueue] = useState<
    { id: number; name: string }[]
  >([]);
  const celebrationId = useRef(0);
  const previousAllDone = useRef<Record<string, boolean>>();

  const currentTime = useCurrentTime();

  useEffect(() => {
    const current: Record<string, boolean> = {};
    config.forEach((child) => {
      current[child.name] = child.tasks.every(
        (task) => (completedTasks[child.name] ?? {})[task.id] ?? false,
      );
    });
    const previous = previousAllDone.current;
    previousAllDone.current = current;
    const everyone = (status: Record<string, boolean>) =>
      config.every((child) => status[child.name]);
    setShowSummary((showing) =>
      everyone(current)
        ? showing || (!!previous && !everyone(previous))
        : false,
    );
    if (!previous) {
      return;
    }
    const newlyDone = config
      .filter((child) => current[child.name] && !previous[child.name])
      .map((child) => child.name);
    if (newlyDone.length > 0) {
      setCelebrationQueue((queue) => [
        ...queue,
        ...newlyDone.map((name) => ({ id: ++celebrationId.current, name })),
      ]);
    }
  }, [completedTasks]);

  const currentCelebration = celebrationQueue[0];

  const longPress = useLongPress();

  const syncFromModel = (
    child: ChildTaskConfig,
    task: TaskConfig,
    tickedAt?: number,
  ) => {
    const status = model.getState().taskCompletionStatus;
    const { [task.id]: existing, ...others } = tickTimes[child.name] ?? {};
    const times = {
      ...tickTimes,
      [child.name]:
        tickedAt === undefined
          ? others
          : { ...others, [task.id]: existing ?? tickedAt },
    };
    setCompletedTasks(status);
    setTickTimes(times);
    saveTaskCompletionStatus(status, dateKey(currentTime), times);
  };

  const handleTaskClick = (
    taskConfig: ChildTaskConfig,
    taskCompleted: TaskConfig,
  ) => {
    model.applyOperation({
      type: "TaskClicked",
      taskConfig,
      completed: taskCompleted,
    });
    syncFromModel(taskConfig, taskCompleted, overrideCurrentTime().getTime());
  };

  const handleTaskUncheck = (taskConfig: ChildTaskConfig, task: TaskConfig) => {
    model.applyOperation({ type: "TaskUnchecked", taskConfig, task });
    syncFromModel(taskConfig, task);
  };

  const everyoneReadyAt = Math.max(
    ...config.map((child) => readyAt(child, tickTimes) ?? 0),
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Swimlanes Container */}
      <div
        className="relative flex flex-1 flex-col overflow-auto p-4"
        style={{ width: "100%" }}
      >
        {model.getState().config.map((child, index) => {
          const totalDuration = child.tasks
            .map((t) => t.duration)
            .reduce((acc, val) => acc + val, 0);
          const windows = taskWindows(child, currentTime);
          const minutesLeft = minutesRemaining(child, currentTime);
          const allDone = child.tasks.every(
            (task) => (completedTasks[child.name] ?? {})[task.id] ?? false,
          );

          return (
            <div
              key={index}
              className="relative bg-white p-4 rounded-lg shadow-lg flex flex-row mb-4 flex-1"
              style={{ minHeight: "0" }}
            >
              {/* Child's name and countdown on the left */}
              <div className="w-1/6 flex flex-col items-center justify-center bg-blue-100 p-2 text-blue-700 font-semibold">
                {child.name}
                <CountdownChip minutesLeft={minutesLeft} allDone={allDone} />
                <ActivityTags activities={activitiesFor(child, currentTime)} />
              </div>
              {/* Tasks container */}
              <div
                className="relative flex flex-1 items-center overflow-x-auto bg-gray-200"
                style={{ gap: "8px" }}
              >
                {child.tasks.map((taskConfig, taskIndex) => {
                  const widthPercentage =
                    (taskConfig.duration / totalDuration) * 100;
                  const completed =
                    (completedTasks[child.name] ?? {})[taskConfig.id] ?? false;
                  const fraction = elapsedFraction(
                    windows[taskIndex],
                    currentTime,
                  );
                  const past = fraction >= 1;
                  const done = completed && past;
                  const overdue = past && !completed;

                  return (
                    <div
                      key={taskIndex}
                      className={`flex items-center justify-center rounded-lg shadow-md ${
                        done
                          ? "bg-gray-300 text-gray-500"
                          : `${child.colorClass} text-blue-950`
                      } ${overdue ? "animate-pulse" : ""}`}
                      style={{
                        flex: `0 0 ${widthPercentage}%`, // Width proportional to task duration
                        height: "100%", // Take up full height of swimlane
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: "clamp(0.75rem, 1.5vw, 1.5rem)",
                        fontWeight: "700",
                        cursor: "pointer",
                        position: "relative",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTouchCallout: "none",
                      }}
                      {...longPress(
                        () => handleTaskClick(child, taskConfig),
                        () => handleTaskUncheck(child, taskConfig),
                      )}
                    >
                      {/* Elapsed-time fill: the colour "catches up" with the schedule */}
                      {!done && fraction > 0 && (
                        <div
                          className={`absolute inset-y-0 left-0 bg-black/20 pointer-events-none rounded-l-lg ${
                            fraction >= 1
                              ? "rounded-r-lg"
                              : "border-r-4 border-black/50"
                          }`}
                          style={{ width: `${fraction * 100}%` }}
                        />
                      )}
                      <StatusIcon completed={completed} overdue={overdue} />
                      {taskConfig.emoji && (
                        <span
                          className="leading-none"
                          style={{ fontSize: "clamp(1.1rem, 2.4vw, 2.25rem)" }}
                        >
                          {taskConfig.emoji}
                        </span>
                      )}
                      <span
                        className={`text-center ${completed ? "font-bold" : ""}`}
                      >
                        {taskConfig.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {showWeekMenu && (
          <WeekMenuPopup
            initialDate={currentTime}
            today={currentTime}
            onClose={() => setShowWeekMenu(false)}
          />
        )}
      </div>

      {/* Bottom bar: clock, week menu and today's lunch options */}
      <div
        className="flex-shrink-0 bg-white shadow-lg flex items-stretch gap-2 p-2"
        style={{ height: "140px" }}
      >
        <div className="flex flex-col items-center justify-center px-3 gap-1">
          <span className="text-lg font-semibold">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <button
            className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold whitespace-nowrap"
            onClick={() => setShowWeekMenu(true)}
          >
            📅 Week menu
          </button>
        </div>
        <LunchPanel date={currentTime} title="Lunch today" />
      </div>
      {showSummary && !currentCelebration && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-5 max-w-2xl w-full text-center">
            <span className="text-5xl font-extrabold text-blue-900">
              Everyone&apos;s ready! 🎉
            </span>
            {everyoneReadyAt > 0 && (
              <span className="text-xl font-bold text-gray-600">
                All set at {format(everyoneReadyAt, "HH:mm")}
              </span>
            )}
            <BadgeList badges={morningBadges(config, tickTimes, currentTime)} />
            <button
              className="px-5 py-2 rounded-xl bg-amber-400 text-amber-950 font-extrabold"
              onClick={() => setShowSummary(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {currentCelebration && (
        <CelebrationOverlay
          key={currentCelebration.id}
          message={`🎉 Well done ${currentCelebration.name}! 🎉`}
          onDone={() => setCelebrationQueue((queue) => queue.slice(1))}
        />
      )}
    </div>
  );
};

export default App;

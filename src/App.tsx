import React, { useEffect, useRef, useState } from "react";
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
import ActivityTags from "./ActivityTags";
import LunchPanel from "./LunchPanel";
import WeekMenuPopup from "./WeekMenuPopup";
import { dateKey } from "./lunches";
import {
  loadTaskCompletionStatus,
  saveTaskCompletionStatus,
} from "./storage";

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
    } absolute bottom-2 right-2 fa-2x`}
    style={{ opacity: 1 }}
  />
);

const CONFETTI_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

const CELEBRATION_MILLIS = 4000;

const CelebrationOverlay = ({ name }: { name: string }) => {
  const [pieces] = useState(() =>
    Array.from({ length: 120 }, (_, id) => {
      const xMid = (Math.random() - 0.5) * 90;
      return {
        id,
        delay: Math.random() * 0.4,
        width: 8 + Math.random() * 6,
        height: 10 + Math.random() * 8,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
        xMid,
        xEnd: xMid + (Math.random() - 0.5) * 20,
        peak: -(40 + Math.random() * 45),
        spinMid: 360 + Math.random() * 360,
        spinEnd: 720 + Math.random() * 720,
      };
    }),
  );

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden bg-black/30"
      data-testid="celebration"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          style={{
            position: "absolute",
            bottom: "-20px",
            left: "50vw",
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            backgroundColor: piece.color,
            animation: `confetti-burst 3.2s ${piece.delay}s both`,
            ["--burst-x-mid" as string]: `${piece.xMid}vw`,
            ["--burst-x-end" as string]: `${piece.xEnd}vw`,
            ["--burst-peak" as string]: `${piece.peak}vh`,
            ["--burst-spin-mid" as string]: `${piece.spinMid}deg`,
            ["--burst-spin-end" as string]: `${piece.spinEnd}deg`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-white font-extrabold text-center drop-shadow-lg px-4"
          style={{
            fontSize: "5rem",
            animation: "celebration-pop 0.6s ease-out both",
          }}
        >
          🎉 Well done {name}! 🎉
        </span>
      </div>
    </div>
  );
};

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

const overrideCurrentTime = (): Date => {
  const params = new URLSearchParams(window.location.search);
  const fixedTime = params.get("fixCurrentTime");

  if (fixedTime) {
    const parsedTime = new Date(fixedTime);
    return isNaN(parsedTime.getTime()) ? new Date() : parsedTime;
  }
  return new Date();
};

const initialModelState: ModelState = {
  config: config,
  taskCompletionStatus:
    loadTaskCompletionStatus(config, dateKey(overrideCurrentTime())) ??
    initialiseTaskCompletionStatus(config),
  lastUpdate: new Date().toISOString(),
};

const model = new TaskModel(initialModelState);

const useCurrentTime = (): Date => {
  const [currentTime, setCurrentTime] = useState(overrideCurrentTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(overrideCurrentTime);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return currentTime;
};

const App: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<TaskCompletionStatus>(
    model.getState().taskCompletionStatus,
  );
  const [showWeekMenu, setShowWeekMenu] = useState(false);
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
        (task) => (completedTasks[child.name] ?? {})[task.name] ?? false,
      );
    });
    const previous = previousAllDone.current;
    previousAllDone.current = current;
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

  useEffect(() => {
    if (!currentCelebration) {
      return;
    }
    const timeout = setTimeout(
      () => setCelebrationQueue((queue) => queue.slice(1)),
      CELEBRATION_MILLIS,
    );
    return () => clearTimeout(timeout);
  }, [currentCelebration]);

  const longPressTimer = useRef<number>();
  const longPressFired = useRef(false);

  const syncFromModel = () => {
    const status = model.getState().taskCompletionStatus;
    setCompletedTasks(status);
    saveTaskCompletionStatus(status, dateKey(currentTime));
  };

  const handleTaskClick = (
    taskConfig: ChildTaskConfig,
    taskCompleted: TaskConfig,
  ) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    model.applyOperation({
      type: "TaskClicked",
      taskConfig,
      completed: taskCompleted,
    });
    syncFromModel();
  };

  const handleTaskUncheck = (taskConfig: ChildTaskConfig, task: TaskConfig) => {
    model.applyOperation({ type: "TaskUnchecked", taskConfig, task });
    syncFromModel();
  };

  const startLongPress = (taskConfig: ChildTaskConfig, task: TaskConfig) => {
    longPressFired.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      handleTaskUncheck(taskConfig, task);
    }, 600);
  };

  const cancelLongPress = () => {
    window.clearTimeout(longPressTimer.current);
  };

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
            (task) => (completedTasks[child.name] ?? {})[task.name] ?? false,
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
                    (completedTasks[child.name] ?? {})[taskConfig.name] ??
                    false;
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
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        position: "relative",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTouchCallout: "none",
                      }}
                      onClick={() => handleTaskClick(child, taskConfig)}
                      onPointerDown={() => startLongPress(child, taskConfig)}
                      onPointerUp={cancelLongPress}
                      onPointerLeave={cancelLongPress}
                      onContextMenu={(e) => e.preventDefault()}
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
                        <span className="text-4xl leading-none">
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
      {currentCelebration && (
        <CelebrationOverlay
          key={currentCelebration.id}
          name={currentCelebration.name}
        />
      )}
    </div>
  );
};

export default App;

import React, { useEffect, useState } from "react";
import {
  Activity,
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
import LunchPanel from "./LunchPanel";
import WeekMenuPopup from "./WeekMenuPopup";

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

const activityTags: Record<Activity, { label: string; classes: string }> = {
  pe: { label: "🤸 PE", classes: "bg-orange-200 text-orange-900" },
  outdoor: { label: "🌳 Outdoor", classes: "bg-green-200 text-green-900" },
};

const ActivityTags = ({ activities }: { activities: Activity[] }) => (
  <>
    {activities.map((activity) => (
      <span
        key={activity}
        className={`mt-1 px-2 py-0.5 rounded-full text-xs font-bold shadow ${activityTags[activity].classes}`}
      >
        {activityTags[activity].label}
      </span>
    ))}
  </>
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
  taskCompletionStatus: initialiseTaskCompletionStatus(config),
  lastUpdate: new Date().toISOString(),
};

const model = new TaskModel(initialModelState);

const overrideCurrentTime = (): Date => {
  const params = new URLSearchParams(window.location.search);
  const fixedTime = params.get("fixCurrentTime");

  if (fixedTime) {
    const parsedTime = new Date(fixedTime);
    return isNaN(parsedTime.getTime()) ? new Date() : parsedTime;
  }
  return new Date();
};

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
    {},
  );
  const [showWeekMenu, setShowWeekMenu] = useState(false);

  const currentTime = useCurrentTime();

  const handleTaskClick = (
    taskConfig: ChildTaskConfig,
    taskCompleted: TaskConfig,
  ) => {
    console.log(
      "task completed: " + JSON.stringify({ taskConfig, taskCompleted }),
    );
    model.applyOperation({
      type: "TaskClicked",
      taskConfig,
      completed: taskCompleted,
    });
    setCompletedTasks(model.getState().taskCompletionStatus);
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
                      }}
                      onClick={() => handleTaskClick(child, taskConfig)}
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
    </div>
  );
};

export default App;

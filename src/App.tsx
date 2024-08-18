import React, { useEffect, useState } from "react";
import {
  ChildTaskConfig,
  initialiseTaskCompletionStatus,
  ModelState,
  TaskCompletionStatus,
  TaskConfig,
  TaskModel,
} from "./model";
import { config } from "./config";

const StatusIcon = ({ completed }: { completed: boolean }) => (
  <i
    className={`fas ${completed ? "fa-check text-green-600" : "fa-hourglass-half text-yellow-600"} absolute bottom-2 right-2 text-xl`}
    style={{ opacity: 1 }}
  />
);

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
  const [completedTasks, setCompletedTasks] = useState<{
    [key: string]: boolean;
  }>({});

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

  const currentTime = useCurrentTime();
  const startTime = model.startTime();
  const endTime = model.endTime();

  const totalMinutes = Math.ceil(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60),
  );

  const timeElapsed = Math.ceil(
    (currentTime.getTime() - startTime.getTime()) / (1000 * 60),
  );
  const tasksWidthPercentage = 82;
  const linePosition = Math.min(
    100,
    timeElapsed / totalMinutes + (100 - tasksWidthPercentage),
  );

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
          const totalDuration =
            child.tasks
              .map((t) => t.duration)
              .reduce((acc, val) => acc + val, 0) * tasksWidthPercentage;

          return (
            <div
              key={index}
              className="relative bg-white p-4 rounded-lg shadow-lg flex flex-row mb-4 flex-1"
              style={{ minHeight: "0" }}
            >
              {/* Child's name on the left */}
              <div className="w-1/6 flex items-center justify-center bg-blue-100 p-2 text-blue-700 font-semibold">
                {child.name}
              </div>
              {/* Tasks container */}
              {/* Vertical line indicating the current time */}
              <div
                className="relative flex flex-1 items-center overflow-x-auto bg-gray-200"
                style={{ width: `${tasksWidthPercentage}%`, gap: "8px" }}
              >
                {child.tasks.map((taskConfig, taskIndex) => {
                  const widthPercentage =
                    (taskConfig.duration / totalDuration) * 100;
                  const completed =
                    (completedTasks[child.name] ?? {})[taskConfig.name] ??
                    false;

                  return (
                    <div
                      key={taskIndex}
                      className={`flex items-center justify-center bg-blue-500 text-white rounded-lg shadow-md ${child.colorClass} text-blue-950`}
                      style={{
                        flex: `0 0 ${widthPercentage * tasksWidthPercentage}%`, // Distribute horizontal space equally
                        height: "100%", // Take up full height of swimlane
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onClick={() => handleTaskClick(child, taskConfig)}
                    >
                      <StatusIcon completed={completed} />
                      <span className={`ml-2 ${completed ? "font-bold" : ""}`}>
                        {taskConfig.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-red-500"
          style={{ left: `${linePosition}%`, width: "2px" }}
        />
      </div>

      {/* Clock at the bottom */}
      <div
        className="flex-shrink-0 bg-white shadow-lg flex items-center justify-center p-4"
        style={{ height: "100px" }}
      >
        <span className="text-lg font-semibold">
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default App;

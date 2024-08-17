import React, { useState, useEffect } from "react";
import { ModelState } from "./storage";
import { TaskModel } from "./model";

const StatusIcon = ({ completed }: { completed: boolean }) => (
  <i
    className={`fas ${completed ? "fa-check text-green-600" : "fa-hourglass-half text-yellow-600"} absolute bottom-2 right-2 text-xl`}
    style={{ opacity: 1 }}
  />
);

const initialModelState: ModelState = {
  children: [
    {
      name: "Child 1",
      tasks: [
        {
          name: "Eat breakfast",
          expectedCompletionTime: new Date("2024-08-17T08:00:00"),
        },
      ],
      colorClass: "bg-blue-200",
    },
    {
      name: "Child 2",
      tasks: [
        {
          name: "Brush teeth",
          expectedCompletionTime: new Date("2024-08-17T08:15:00"),
        },
      ],
      colorClass: "bg-yellow-400",
    },
    {
      name: "Child 3",
      tasks: [
        {
          name: "Wash face",
          expectedCompletionTime: new Date("2024-08-17T08:30:00"),
        },
      ],
      colorClass: "bg-red-300",
    },
  ],
  taskCompletionStatus: {},
  lastUpdate: new Date().toISOString(),
};

// Initialize the model
const model = new TaskModel(initialModelState);

const App: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<{
    [key: string]: boolean;
  }>({});
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const children = [
    {
      name: "Jacob",
      tasks: ["Eat breakfast", "Brush teeth", "Wash face", "Get dressed"],
      colorClass: "bg-blue-200",
    },
    {
      name: "Calum",
      tasks: [
        "Eat breakfast",
        "Brush teeth",
        "Wash face",
        "Get dressed",
        "Put coat on",
      ],
      colorClass: "bg-yellow-400",
    },
    {
      name: "Dylan",
      tasks: [
        "Eat breakfast",
        "Brush teeth",
        "Wash face",
        "Get dressed",
        "Pick meals",
      ],
      colorClass: "bg-red-300",
    },
  ];

  const currentTime = new Date("2024-08-17T08:20:00");
  const startTime = new Date("2024-08-17T07:45:00");
  const endTime = new Date("2024-08-17T09:00:00");

  // Calculate the time difference in minutes between start time and end time
  const totalMinutes = Math.ceil(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60),
  );

  // Calculate the position of the vertical line based on the current time
  const timeElapsed = Math.ceil(
    (currentTime.getTime() - startTime.getTime()) / (1000 * 60),
  );
  const linePosition = (timeElapsed / totalMinutes) * 100;

  // Initialize audio
  useEffect(() => {
    const alertAudio = new Audio("/path-to-your-alert-sound.mp3"); // Replace with your alert audio file
    setAudio(alertAudio);
  }, []);

  // Timer to check for overdue tasks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeElapsed = Math.ceil(
        (now.getTime() - startTime.getTime()) / (1000 * 60),
      );
      if (timeElapsed >= totalMinutes) {
        const overdueTasks = Object.keys(completedTasks).filter(
          (task) => !completedTasks[task],
        );
        if (overdueTasks.length > 0 && audio) {
          audio.play();
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [completedTasks, audio, startTime, totalMinutes]);

  const handleTaskClick = (task: string) => {
    console.log("task completed: " + task);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Swimlanes Container */}
      <div
        className="relative flex flex-1 flex-col overflow-auto p-4"
        style={{ width: "100%" }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="relative bg-white p-4 rounded-lg shadow-lg flex flex-row mb-4 flex-1"
            style={{ minHeight: "0" }} // Ensures flex items respect flex-grow
          >
            {/* Child's name on the left */}
            <div className="w-1/6 flex items-center justify-center bg-blue-100 p-2 text-blue-700 font-semibold">
              {child.name}
            </div>
            {/* Tasks container */}
            <div
              className="relative flex flex-1 items-center overflow-x-auto bg-gray-200"
              style={{ width: "75%", gap: "8px" }} // Use gap for horizontal spacing between tasks
            >
              {child.tasks.map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  className={`flex items-center justify-center bg-blue-500 text-white rounded-lg shadow-md ${child.colorClass} text-blue-950`}
                  style={{
                    flex: `1 1 0`, // Distribute horizontal space equally
                    height: "100%", // Take up full height of swimlane
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => handleTaskClick(task)}
                >
                  <StatusIcon completed={true} />
                  <span className={`ml-2 ${true ? "font-bold" : ""}`}>
                    {task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Vertical line indicating the current time */}
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
          })}
        </span>
      </div>
    </div>
  );
};

export default App;

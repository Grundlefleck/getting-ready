import React from "react";
import { LunchOptions, lunchOptionsFor } from "./lunches";

const mainCards: { key: keyof LunchOptions["mains"]; classes: string }[] = [
  { key: "red", classes: "bg-red-600 text-white" },
  { key: "blue", classes: "bg-sky-500 text-white" },
  { key: "yellow", classes: "bg-yellow-300 text-yellow-950" },
];

const LunchPanel = ({ date, title }: { date: Date; title: string }) => {
  const options = lunchOptionsFor(date);

  return (
    <div className="grid flex-1 gap-2 min-w-0 grid-cols-[7rem_1fr_1fr_1fr_13rem]">
      <div className="flex items-center justify-center px-2 bg-blue-100 text-blue-700 font-semibold rounded-lg text-center min-w-0">
        🍽️ {title}
      </div>
      {options ? (
        <>
          {mainCards.map(({ key, classes }) => (
            <div
              key={key}
              className={`flex items-center justify-center text-center rounded-lg shadow-md px-2 py-1 font-semibold min-w-0 ${classes}`}
            >
              {options.mains[key]}
            </div>
          ))}
          <div className="flex flex-col justify-center px-2 text-sm text-gray-700 min-w-0">
            <span>🍨 {options.soupOrDessert}</span>
            <span>🥕 {options.vegetables}</span>
          </div>
        </>
      ) : (
        <div className="col-span-4 flex items-center justify-center text-gray-600 font-semibold">
          No school lunch — holiday or weekend
        </div>
      )}
    </div>
  );
};

export default LunchPanel;

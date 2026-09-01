import React, { useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { dateKey, LunchOptions, lunchOptionsFor } from "./lunches";
import { activitiesFor } from "./model";
import { config } from "./config";
import { activityTags } from "./ActivityTags";

const mondayOf = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

// Rows in the same order as the school's printed menu
const menuRows: {
  label: string;
  cell: (options: LunchOptions) => string;
  classes: string;
}[] = [
  {
    label: "Soup or Dessert",
    cell: (o) => o.soupOrDessert,
    classes: "bg-gray-100 text-gray-800",
  },
  {
    label: "Main Meal Red",
    cell: (o) => o.mains.red,
    classes: "bg-red-600 text-white",
  },
  {
    label: "Main Meal Blue",
    cell: (o) => o.mains.blue,
    classes: "bg-sky-500 text-white",
  },
  {
    label: "Main Meal Yellow",
    cell: (o) => o.mains.yellow,
    classes: "bg-yellow-300 text-yellow-950",
  },
  {
    label: "Vegetables",
    cell: (o) => o.vegetables,
    classes: "bg-green-50 text-green-900",
  },
];

const WeekMenuPopup = ({
  initialDate,
  today,
  onClose,
}: {
  initialDate: Date;
  today: Date;
  onClose: () => void;
}) => {
  const [monday, setMonday] = useState(() => mondayOf(initialDate));
  const weekDays = [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset));

  return (
    <div
      className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl p-4 w-full max-h-full overflow-y-auto flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold"
            onClick={() => setMonday(addDays(monday, -7))}
          >
            ← previous week
          </button>
          <span className="font-bold text-lg">
            Week commencing {format(monday, "d MMM yyyy")}
          </span>
          <input
            type="date"
            aria-label="Jump to week of date"
            className="border border-gray-300 rounded px-1 text-sm text-gray-700"
            value={dateKey(monday)}
            onChange={(e) =>
              e.target.value &&
              setMonday(mondayOf(new Date(`${e.target.value}T12:00:00`)))
            }
          />
          <button
            className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold"
            onClick={() => setMonday(addDays(monday, 7))}
          >
            next week →
          </button>
          <button
            aria-label="Close week menu"
            className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div
          className="grid gap-2 flex-1"
          style={{ gridTemplateColumns: "8rem repeat(5, 1fr)" }}
        >
          <div
            className="flex items-center justify-center text-center rounded-lg px-2 py-1 font-bold bg-blue-50 text-blue-800"
            style={{ gridColumn: 1, gridRow: 2 }}
          >
            Activities
          </div>
          {menuRows.map((row, r) => (
            <div
              key={row.label}
              className={`flex items-center justify-center text-center rounded-lg px-2 py-1 font-bold ${row.classes}`}
              style={{ gridColumn: 1, gridRow: r + 3 }}
            >
              {row.label}
            </div>
          ))}
          {weekDays.map((day, c) => {
            const options = lunchOptionsFor(day);
            const isToday = dateKey(day) === dateKey(today);
            return (
              <React.Fragment key={dateKey(day)}>
                <div
                  className={`flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-700 font-semibold rounded-lg ${
                    isToday ? "ring-4 ring-blue-500" : ""
                  }`}
                  style={{ gridColumn: c + 2, gridRow: 1 }}
                >
                  {format(day, "EEE d")}
                </div>
                {options ? (
                  <>
                    <div
                      className="flex flex-wrap items-center justify-center gap-1 px-1 py-1"
                      style={{ gridColumn: c + 2, gridRow: 2 }}
                    >
                      {config.flatMap((child) =>
                        activitiesFor(child, day).map((activity) => (
                          <span
                            key={`${child.name}-${activity}`}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold shadow ${activityTags[activity].classes}`}
                          >
                            {child.name} {activityTags[activity].label}
                          </span>
                        )),
                      )}
                    </div>
                    {menuRows.map((row, r) => (
                      <div
                        key={row.label}
                        className={`flex items-center justify-center text-center rounded-lg shadow-md px-2 py-1 font-semibold ${row.classes}`}
                        style={{ gridColumn: c + 2, gridRow: r + 3 }}
                      >
                        {row.cell(options)}
                      </div>
                    ))}
                  </>
                ) : (
                  <div
                    className="flex items-center justify-center text-center rounded-lg bg-gray-100 text-gray-500 font-semibold px-2"
                    style={{ gridColumn: c + 2, gridRow: "2 / 8" }}
                  >
                    No school lunch
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekMenuPopup;

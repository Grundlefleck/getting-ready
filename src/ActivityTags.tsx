import React from "react";
import { Activity } from "./model";

export const activityTags: Record<Activity, { label: string; classes: string }> =
  {
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

export default ActivityTags;

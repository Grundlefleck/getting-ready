import React from "react";
import { colorOf } from "./config";

export interface Badge {
  child: string;
  title: string;
  detail: string;
}

const BadgeList = ({ badges }: { badges: Badge[] }) => (
  <div className="flex flex-wrap gap-3 justify-center">
    {badges.map((badge) => (
      <div
        key={badge.child}
        className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2 text-left"
      >
        <span
          className={`w-10 h-10 rounded-full grid place-items-center font-extrabold text-blue-950 ${colorOf(badge.child)}`}
        >
          {badge.child[0]}
        </span>
        <div>
          <div className="font-extrabold">
            {badge.child}: {badge.title}
          </div>
          <div className="text-sm text-gray-600">{badge.detail}</div>
        </div>
      </div>
    ))}
  </div>
);

export default BadgeList;

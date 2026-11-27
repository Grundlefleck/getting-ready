import React from "react";

const STICKER_SIZE = 8;

const stickerPosition = (i: number) => {
  const angle = (i * 137.5 * Math.PI) / 180;
  const radius = 8 + (i % 5) * 7;
  return {
    left: `${50 + Math.cos(angle) * radius * 1.1 - STICKER_SIZE / 2}%`,
    top: `${60 + Math.sin(angle) * radius * 0.7 - STICKER_SIZE / 2}%`,
    width: `${STICKER_SIZE}%`,
  };
};

const MessMonster = ({
  progress,
  hits,
  colorOf,
}: {
  progress: number;
  hits: string[];
  colorOf: (child: string) => string;
}) => {
  const defeated = progress >= 1;
  const hp = Math.round((1 - progress) * 100);

  return (
    <div
      className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3"
      data-testid="monster"
    >
      <div className="w-full h-5 rounded-full bg-gray-200 overflow-hidden">
        <span
          className="block h-full bg-lime-600 transition-all duration-500"
          style={{ width: `${hp}%` }}
        />
      </div>
      {defeated ? (
        <span className="text-9xl animate-[celebration-pop_0.6s_ease-out]">
          💨
        </span>
      ) : (
        <div
          className="w-full max-w-[16rem] aspect-square origin-bottom transition-transform duration-500"
          style={{ transform: `scale(${0.35 + 0.65 * (1 - progress)})` }}
        >
          <div key={hits.length} className="monster-hit relative w-full h-full">
            <svg
              viewBox="0 0 200 200"
              className="monster-breathe w-full h-full"
            >
              <path
                d="M30 180 Q20 110 50 80 Q60 30 100 40 Q150 25 160 80 Q190 110 172 180 Z"
                fill="#84cc16"
                stroke="#3f6212"
                strokeWidth="5"
              />
              <text x="40" y="170" fontSize="26">
                🧦
              </text>
              <text x="135" y="168" fontSize="24">
                👟
              </text>
              <text x="88" y="70" fontSize="22">
                🪝
              </text>
              <circle
                cx="78"
                cy="100"
                r="16"
                fill="#fff"
                stroke="#3f6212"
                strokeWidth="3"
              />
              <circle cx="82" cy="104" r="7" fill="#1a2e05" />
              <circle
                cx="124"
                cy="96"
                r="20"
                fill="#fff"
                stroke="#3f6212"
                strokeWidth="3"
              />
              <circle cx="120" cy="100" r="8" fill="#1a2e05" />
              <path
                d={`M70 140 Q100 ${progress > 0.5 ? 125 : 160} 135 140`}
                stroke="#1a2e05"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            {hits.map((child, i) => (
              <span
                key={i}
                data-testid="hit"
                className={`absolute aspect-square rounded-full ring-2 ring-white ${colorOf(child)}`}
                style={stickerPosition(i)}
              />
            ))}
          </div>
        </div>
      )}
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {defeated ? "Mess monster defeated!" : `Mess monster: ${hp} HP left`}
      </span>
    </div>
  );
};

export default MessMonster;

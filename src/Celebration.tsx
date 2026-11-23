import React, { useState } from "react";

const CONFETTI_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export const CELEBRATION_MILLIS = 4000;

const CelebrationOverlay = ({ message }: { message: string }) => {
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
          {message}
        </span>
      </div>
    </div>
  );
};

export default CelebrationOverlay;

import React, { useEffect, useRef, useState } from "react";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

const CELEBRATION_MILLIS = 4000;
const FIRE_MILLIS = 7500;

type Piece = { style: React.CSSProperties; content?: string };

const vars = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values).map(([name, value]) => [`--${name}`, value]),
  ) as React.CSSProperties;

const between = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)];

const confetti = (): Piece[] =>
  Array.from({ length: 120 }, (_, i) => {
    const xMid = between(-45, 45);
    return {
      style: {
        bottom: "-20px",
        left: "50vw",
        width: `${between(8, 14)}px`,
        height: `${between(10, 18)}px`,
        backgroundColor: COLORS[i % COLORS.length],
        animation: `confetti-burst 3.2s ${between(0, 0.4)}s both`,
        ...vars({
          "burst-x-mid": `${xMid}vw`,
          "burst-x-end": `${xMid + between(-10, 10)}vw`,
          "burst-peak": `${-between(40, 85)}vh`,
          "burst-spin-mid": `${between(360, 720)}deg`,
          "burst-spin-end": `${between(720, 1440)}deg`,
        }),
      },
    };
  });

const balloons = (): Piece[] =>
  Array.from({ length: 28 }, () => ({
    content: "🎈",
    style: {
      bottom: "-15vh",
      left: `${between(0, 95)}vw`,
      fontSize: `${between(3, 6)}rem`,
      filter: `hue-rotate(${between(0, 360)}deg)`,
      animation: `balloon-rise ${between(2.6, 3.6)}s ${between(0, 0.8)}s ease-in both`,
      ...vars({ sway: `${between(-8, 8)}vw` }),
    },
  }));

const fireworks = (): Piece[] =>
  Array.from({ length: 6 }, (_, burst) => {
    const left = between(15, 85);
    const top = between(15, 60);
    const color = COLORS[burst % COLORS.length];
    const delay = burst * 0.45;
    return Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * 2 * Math.PI;
      const distance = between(14, 22);
      return {
        style: {
          left: `${left}vw`,
          top: `${top}vh`,
          width: "8px",
          height: "8px",
          borderRadius: "9999px",
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          animation: `firework-spark 1.4s ${delay}s ease-out both`,
          ...vars({
            dx: `${Math.cos(angle) * distance}vmin`,
            dy: `${Math.sin(angle) * distance}vmin`,
          }),
        },
      };
    });
  }).flat();

const stars = (): Piece[] =>
  Array.from({ length: 70 }, () => ({
    content: pick(["⭐", "🌟", "✨"]),
    style: {
      top: "-10vh",
      left: `${between(0, 97)}vw`,
      fontSize: `${between(1.5, 3.5)}rem`,
      animation: `star-fall ${between(1.8, 3)}s ${between(0, 1.2)}s ease-in both`,
      ...vars({ spin: `${between(-540, 540)}deg` }),
    },
  }));

const EFFECTS = {
  confetti,
  balloons,
  fireworks,
  stars,
  fire: (): Piece[] => [],
};

export type CelebrationEffect = keyof typeof EFFECTS;
export const celebrationEffects = Object.keys(EFFECTS) as CelebrationEffect[];

const POP = "celebration-pop 0.6s ease-out both";
const ON_FIRE = `${POP}, fire-flicker 0.12s 0.3s 50 alternate, fire-out 0.8s 6.3s forwards`;

const CelebrationOverlay = ({
  message,
  effect,
  onDone,
}: {
  message: string;
  effect?: CelebrationEffect;
  onDone: () => void;
}) => {
  const [chosen] = useState(() => effect ?? pick(celebrationEffects));
  const [pieces] = useState(EFFECTS[chosen]);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const timeout = setTimeout(
      () => done.current(),
      chosen === "fire" ? FIRE_MILLIS : CELEBRATION_MILLIS,
    );
    return () => clearTimeout(timeout);
  }, [chosen]);

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden bg-black/30"
      data-testid="celebration"
    >
      {pieces.map((piece, i) => (
        <span key={i} className="absolute leading-none" style={piece.style}>
          {piece.content}
        </span>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-white font-extrabold text-center drop-shadow-lg px-4"
          style={{
            fontSize: "5rem",
            animation: chosen === "fire" ? ON_FIRE : POP,
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
};

export default CelebrationOverlay;

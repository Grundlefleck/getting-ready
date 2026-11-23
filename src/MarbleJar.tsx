import React from "react";

const MarbleJar = ({
  marbles,
  capacity,
  colorOf,
}: {
  marbles: string[];
  capacity: number;
  colorOf: (child: string) => string;
}) => {
  const columns = Math.max(6, Math.ceil(Math.sqrt(capacity)));
  const slots = Array.from({ length: capacity }, (_, i) => marbles[i]);
  const rows: (string | undefined)[][] = [];
  for (let i = 0; i < slots.length; i += columns) {
    rows.push(slots.slice(i, i + columns));
  }

  return (
    <div className="flex-1 min-h-0 flex justify-center items-end">
      <div className="relative w-full max-w-xs border-x-8 border-b-8 border-slate-300 rounded-b-[3rem] px-3 pb-4 pt-8 flex flex-col-reverse gap-1 bg-sky-50">
        <div className="absolute -top-3 -left-5 -right-5 h-4 rounded-lg bg-slate-300" />
        {rows.map((row, r) => (
          <div
            key={r}
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {row.map((child, c) => (
              <span
                key={c}
                className={`aspect-square rounded-full ${
                  child ? `${colorOf(child)} marble` : ""
                }`}
                data-testid={child ? "marble" : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarbleJar;

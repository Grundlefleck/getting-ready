import React, { useState } from "react";
import { tidyPresets } from "./tidyConfig";
import { TidyKind, TidyTask } from "./tidyModel";

const KIND_LABELS: Record<TidyKind, string> = {
  team: "Team job",
  count: "Count job",
  each: "Everyone's own",
};

const JobPicker = ({
  library,
  selectedIds,
  onSelect,
  onAdd,
  onStartFresh,
  onClose,
}: {
  library: TidyTask[];
  selectedIds: string[];
  onSelect: (taskIds: string[]) => void;
  onAdd: (task: TidyTask) => void;
  onStartFresh: () => void;
  onClose: () => void;
}) => {
  const [emoji, setEmoji] = useState("✨");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TidyKind>("team");
  const [minutes, setMinutes] = useState("1");

  const selected = new Set(selectedIds);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelect(library.filter((task) => next.has(task.id)).map((t) => t.id));
  };

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const parsedMinutes = parseFloat(minutes);
    onAdd({
      id: `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      name: trimmed,
      emoji: emoji.trim() || "✨",
      kind,
      seconds: parsedMinutes > 0 ? Math.round(parsedMinutes * 60) : 60,
    });
    setName("");
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full overflow-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-blue-900">
            ✏️ Today&apos;s jobs
          </h2>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold"
            onClick={onClose}
          >
            Done
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-2">
            Presets
          </span>
          {tidyPresets.map((preset) => (
            <button
              key={preset.name}
              className="px-4 py-2 rounded-lg bg-gray-100 border-2 border-gray-200 font-bold hover:border-amber-400"
              onClick={() => onSelect(preset.taskIds)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {library.map((task) => {
            const on = selected.has(task.id);
            return (
              <button
                key={task.id}
                aria-pressed={on}
                className={`px-3 py-2 rounded-full border-2 flex items-center gap-2 font-semibold ${
                  on
                    ? "bg-amber-400 border-amber-400 text-amber-950"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
                onClick={() => toggle(task.id)}
              >
                <span>{task.emoji}</span>
                <span>{task.name}</span>
                <span className="text-[0.65rem] uppercase tracking-wider opacity-70">
                  {task.kind}
                </span>
              </button>
            );
          })}
        </div>

        <form
          className="flex flex-wrap gap-2 items-center border-t pt-4"
          onSubmit={add}
        >
          <input
            aria-label="Emoji"
            className="w-14 text-center border-2 rounded-lg px-2 py-1"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <input
            aria-label="New job"
            placeholder="New job, e.g. Books back on shelf"
            className="flex-1 min-w-[12rem] border-2 rounded-lg px-3 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            aria-label="Kind of job"
            className="border-2 rounded-lg px-2 py-1"
            value={kind}
            onChange={(e) => setKind(e.target.value as TidyKind)}
          >
            {(Object.keys(KIND_LABELS) as TidyKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-sm text-gray-600">
            about
            <input
              aria-label="Minutes"
              type="number"
              min={0.25}
              step={0.25}
              className="w-16 border-2 rounded-lg px-2 py-1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            min
          </label>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-gray-800 text-white font-bold"
          >
            Add
          </button>
        </form>

        <div className="flex justify-between items-center border-t pt-4 text-sm text-gray-600">
          <span>
            Team: anyone helps · Count: tap per item · Everyone&apos;s own: each
            child ticks theirs. Long-press a face to undo.
          </span>
          <button
            className="px-3 py-1.5 rounded-lg border-2 border-red-300 text-red-700 font-bold whitespace-nowrap"
            onClick={onStartFresh}
          >
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobPicker;

import React, { useState } from "react";
import { celebrationEffects } from "./Celebration";
import { tidyPresets } from "./tidyConfig";
import { CelebrationChoice } from "./tidyStorage";
import { TidyKind, TidyReward, tidyRewards, TidyTask } from "./tidyModel";

const KIND_LABELS: Record<TidyKind, string> = {
  team: "Team job",
  count: "Count job",
  each: "Everyone's own",
};

const REWARD_LABELS: Record<TidyReward, string> = {
  jar: "🫙 Marble jar",
  monster: "👾 Mess monster",
};

const CELEBRATION_LABELS: Record<CelebrationChoice, string> = {
  random: "🎲 Random",
  confetti: "🎊 Confetti",
  balloons: "🎈 Balloons",
  fireworks: "🎆 Fireworks",
  stars: "⭐ Stars",
  fire: "🔥 Fire",
};

const OptionRow = <T extends string>({
  title,
  options,
  labels,
  value,
  onChange,
}: {
  title: string;
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className="flex flex-wrap gap-2 items-center border-t pt-4">
    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-2">
      {title}
    </span>
    {options.map((option) => (
      <button
        key={option}
        aria-pressed={option === value}
        className={`px-4 py-2 rounded-lg border-2 font-bold ${
          option === value
            ? "bg-amber-400 border-amber-400 text-amber-950"
            : "bg-gray-100 border-gray-200"
        }`}
        onClick={() => onChange(option)}
      >
        {labels[option]}
      </button>
    ))}
  </div>
);

const EMOJIS = [
  "🧥 👟 🪝 🧦 👕 👖 🧤 🧢",
  "🎒 🥋 ⚽ 🏀 🛏️ 🧸 🧩 🎮",
  "🎲 🚗 🚲 🛴 📚 ✏️ 🖍️ 🎨",
  "🍽️ 🍴 🥤 🧃 🛋️ 📦 🧺 🧹",
  "🧽 🧻 🧴 🛁 🚿 🗑️ ♻️ 🚪",
  "💡 🛒 🐶 🐱 🐟 🌱 ✨ ⭐",
].flatMap((row) => row.split(" "));

const EMPTY_FORM = {
  emoji: "✨",
  name: "",
  kind: "team" as TidyKind,
  minutes: "1",
};

const JobPicker = ({
  library,
  selectedIds,
  reward,
  celebration,
  onSelect,
  onSave,
  onDelete,
  onReward,
  onCelebration,
  onStartFresh,
  onClose,
}: {
  library: TidyTask[];
  selectedIds: string[];
  reward: TidyReward;
  celebration: CelebrationChoice;
  onSelect: (taskIds: string[]) => void;
  onSave: (task: TidyTask) => void;
  onDelete: (taskId: string) => void;
  onReward: (reward: TidyReward) => void;
  onCelebration: (celebration: CelebrationChoice) => void;
  onStartFresh: () => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string>();
  const [choosingEmoji, setChoosingEmoji] = useState(false);

  const selected = new Set(selectedIds);
  const known = (ids: string[]) =>
    library.filter((task) => ids.includes(task.id)).map((task) => task.id);
  const toggle = (id: string) =>
    onSelect(
      known(
        selected.has(id)
          ? selectedIds.filter((x) => x !== id)
          : [...selectedIds, id],
      ),
    );

  const edit = (task: TidyTask) => {
    setEditingId(task.id);
    setForm({
      emoji: task.emoji,
      name: task.name,
      kind: task.kind,
      minutes: String(task.seconds / 60),
    });
  };

  const reset = () => {
    setEditingId(undefined);
    setChoosingEmoji(false);
    setForm(EMPTY_FORM);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      return;
    }
    const minutes = parseFloat(form.minutes);
    onSave({
      id:
        editingId ??
        `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      name,
      emoji: form.emoji,
      kind: form.kind,
      seconds: minutes > 0 ? Math.round(minutes * 60) : 60,
    });
    reset();
  };

  const remove = () => {
    if (editingId) {
      onDelete(editingId);
    }
    reset();
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
              onClick={() => onSelect(known(preset.taskIds))}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {library.map((task) => {
            const on = selected.has(task.id);
            const colours = on
              ? "bg-amber-400 border-amber-400 text-amber-950"
              : "bg-white border-gray-200 text-gray-700";
            return (
              <span
                key={task.id}
                className={`inline-flex rounded-full border-2 font-semibold ${colours} ${
                  editingId === task.id ? "ring-4 ring-blue-400" : ""
                }`}
              >
                <button
                  aria-pressed={on}
                  className="pl-3 pr-2 py-2 flex items-center gap-2"
                  onClick={() => toggle(task.id)}
                >
                  <span>{task.emoji}</span>
                  <span>{task.name}</span>
                  <span className="text-[0.65rem] uppercase tracking-wider opacity-70">
                    {task.kind}
                  </span>
                </button>
                <button
                  aria-label={`Edit ${task.name}`}
                  className="pl-1 pr-3 opacity-60"
                  onClick={() => edit(task)}
                >
                  <i className="fas fa-pen text-xs" />
                </button>
              </span>
            );
          })}
        </div>

        <form
          className="flex flex-wrap gap-2 items-center border-t pt-4"
          onSubmit={submit}
        >
          <button
            type="button"
            aria-label="Emoji"
            aria-expanded={choosingEmoji}
            className="w-14 h-10 text-2xl border-2 rounded-lg"
            onClick={() => setChoosingEmoji(!choosingEmoji)}
          >
            {form.emoji}
          </button>
          <input
            aria-label="Job name"
            placeholder="New job, e.g. Books back on shelf"
            className="flex-1 min-w-[12rem] border-2 rounded-lg px-3 py-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            aria-label="Kind of job"
            className="border-2 rounded-lg px-2 py-1"
            value={form.kind}
            onChange={(e) =>
              setForm({ ...form, kind: e.target.value as TidyKind })
            }
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
              value={form.minutes}
              onChange={(e) => setForm({ ...form, minutes: e.target.value })}
            />
            min
          </label>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-gray-800 text-white font-bold"
          >
            {editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <>
              <button
                type="button"
                className="px-4 py-1.5 rounded-lg border-2 border-red-300 text-red-700 font-bold"
                onClick={remove}
              >
                Delete
              </button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-lg bg-gray-200 font-bold"
                onClick={reset}
              >
                Cancel
              </button>
            </>
          )}
          {choosingEmoji && (
            <div className="w-full grid grid-cols-8 gap-1 bg-gray-50 rounded-xl p-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={emoji === form.emoji}
                  className={`text-3xl py-1 rounded-lg ${
                    emoji === form.emoji ? "bg-amber-300" : ""
                  }`}
                  onClick={() => {
                    setForm({ ...form, emoji });
                    setChoosingEmoji(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </form>

        <OptionRow
          title="Reward"
          options={tidyRewards}
          labels={REWARD_LABELS}
          value={reward}
          onChange={onReward}
        />

        <OptionRow
          title="Celebration"
          options={["random", ...celebrationEffects]}
          labels={CELEBRATION_LABELS}
          value={celebration}
          onChange={onCelebration}
        />

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

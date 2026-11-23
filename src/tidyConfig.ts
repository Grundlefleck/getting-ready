import { TidyPreset, TidyTask } from "./tidyModel";

export const defaultTidyLibrary: TidyTask[] = [
  {
    id: "shoes-coats",
    name: "Hang up shoes & coats",
    emoji: "🧥",
    kind: "each",
    seconds: 180,
  },
  {
    id: "coat-hangers",
    name: "Collect coat hangers",
    emoji: "🪝",
    kind: "count",
    seconds: 360,
  },
  {
    id: "pyjamas",
    name: "Pyjamas to bedroom",
    emoji: "🛏️",
    kind: "team",
    seconds: 45,
  },
  {
    id: "own-stuff",
    name: "Own stuff off the floor",
    emoji: "🧸",
    kind: "each",
    seconds: 90,
  },
  {
    id: "karate-gear",
    name: "Lay out karate gear",
    emoji: "🥋",
    kind: "each",
    seconds: 45,
  },
  {
    id: "toys-boxes",
    name: "Toys back in boxes",
    emoji: "📦",
    kind: "team",
    seconds: 180,
  },
  {
    id: "books",
    name: "Books on the shelf",
    emoji: "📚",
    kind: "count",
    seconds: 90,
  },
  {
    id: "dirty-clothes",
    name: "Dirty clothes in basket",
    emoji: "🧺",
    kind: "each",
    seconds: 60,
  },
  {
    id: "clear-table",
    name: "Clear the table",
    emoji: "🍽️",
    kind: "team",
    seconds: 90,
  },
  {
    id: "cushions",
    name: "Cushions on sofa",
    emoji: "🛋️",
    kind: "team",
    seconds: 30,
  },
];

export const tidyPresets: TidyPreset[] = [
  {
    name: "Before karate",
    taskIds: [
      "shoes-coats",
      "coat-hangers",
      "pyjamas",
      "own-stuff",
      "karate-gear",
    ],
  },
  {
    name: "Saturday reset",
    taskIds: ["toys-boxes", "books", "dirty-clothes", "cushions", "own-stuff"],
  },
  {
    name: "After dinner",
    taskIds: ["clear-table", "cushions", "shoes-coats"],
  },
];

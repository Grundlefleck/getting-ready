import { ChildTaskConfig } from "./model";

export const config: ChildTaskConfig[] = [
  {
    name: "Jacob",
    startTime: "07:45",
    tasks: [
      { name: "Eat breakfast", duration: 30 },
      { name: "Brush teeth", duration: 3 },
      { name: "Wash face", duration: 2 },
      { name: "Get dressed", duration: 15 },
      { name: "Choose snack", duration: 2 },
      { name: "Brush hair", duration: 2 },
      { name: "Shoes and coat on", duration: 2 },
    ],
    colorClass: "bg-red-600",
  },
  {
    name: "Calum",
    startTime: "07:45",
    tasks: [
      { name: "Eat breakfast", duration: 30 },
      { name: "Brush teeth", duration: 3 },
      { name: "Wash face", duration: 2 },
      { name: "Get dressed", duration: 15 },
      { name: "Choose snack", duration: 2 },
      { name: "Brush hair", duration: 2 },
      { name: "Shoes and coat on", duration: 2 },
    ],
    colorClass: "bg-blue-600",
  },
  {
    name: "Dylan",
    startTime: "07:45",
    tasks: [
      { name: "Eat breakfast", duration: 30 },
      { name: "Brush teeth", duration: 3 },
      { name: "Wash face", duration: 2 },
      { name: "Get dressed", duration: 15 },
      { name: "Choose snack", duration: 2 },
      { name: "Brush hair", duration: 2 },
      { name: "Shoes and coat on", duration: 2 },
    ],
    colorClass: "bg-purple-300",
  },
];

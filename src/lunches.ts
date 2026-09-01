import { format } from "date-fns";
import lunchMenu from "./lunchMenu.json";

export interface LunchOptions {
  week: number;
  soupOrDessert: string;
  mains: {
    red: string;
    blue: string;
    yellow: string;
  };
  vegetables: string;
}

const days: Record<string, LunchOptions> = lunchMenu.days;

// Local calendar date as the yyyy-MM-dd key used by the menu config.
export const dateKey = (date: Date): string => format(date, "yyyy-MM-dd");

// Returns undefined for weekends and school holidays: no lunch that day.
export const lunchOptionsFor = (date: Date): LunchOptions | undefined =>
  days[dateKey(date)];

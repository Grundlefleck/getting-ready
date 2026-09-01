// Generates src/lunchMenu.json from the school's three rotating weekly menus.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const menus = {
  1: {
    monday: {
      soupOrDessert: "Corn on the Cob",
      mains: {
        red: "Quorn Katsu Curry with Boiled Rice",
        blue: "Cheese and Tomato Pizza",
        yellow: "Baked Potato with Cheese or Tuna Mayo and Coleslaw",
      },
      vegetables: "Peas and Salad Bar",
    },
    tuesday: {
      soupOrDessert: "Custard Cream",
      mains: {
        red: "Chicken Goujons with Potato Wedges",
        blue: "Tomato, Pepper and Basil Pasta with Garlic Bread",
        yellow: "Cheese Sandwich and Coleslaw",
      },
      vegetables: "Broccoli, Baked Beans and Salad Bar",
    },
    wednesday: {
      soupOrDessert: "Potato and Leek Soup",
      mains: {
        red: "Beef Bolognaise with Pasta",
        blue: "Quorn Burrito Wrap",
        yellow: "Baked Potato with Cheese or Tuna Mayo and Coleslaw",
      },
      vegetables: "Sweetcorn and Salad Bar",
    },
    thursday: {
      soupOrDessert: "Vanilla Ice Cream",
      mains: {
        red: "Sausages with Onion Gravy, Mashed Potatoes and Yorkshire Pudding",
        blue: "Quorn Dippers with Mashed Potato",
        yellow: "Chicken Sandwich and Coleslaw",
      },
      vegetables: "Baked Beans, Carrots and Salad Bar",
    },
    friday: {
      soupOrDessert: "Lentil Soup",
      mains: {
        red: "Sustainable Fish and Chips, Tomato Sauce",
        blue: "Vegan Sausage Roll with Chips",
        yellow: "Cheese Wrap with Chips",
      },
      vegetables: "Peas and Salad Bar",
    },
  },
  2: {
    monday: {
      soupOrDessert: "Lentil Soup",
      mains: {
        red: "Macaroni Cheese",
        blue: "Meat Free Mince, Diced Potatoes",
        yellow: "Baked Potato with Cheese or Tuna Mayo and Coleslaw",
      },
      vegetables: "Carrots and Salad Bar",
    },
    tuesday: {
      soupOrDessert: "Coconut and Raspberry Sponge Cake",
      mains: {
        red: "Chicken Burger in a Bun with Potato Wedges, Mayonnaise Portion",
        blue: "Quorn Burrito Wrap",
        yellow: "Cheese Sandwich and Coleslaw",
      },
      vegetables: "Baked Beans, Sweetcorn and Salad Bar",
    },
    wednesday: {
      soupOrDessert: "Tomato Soup",
      mains: {
        red: "Steak and Sausage Pie with Mash Potato",
        blue: "Cheese and Tomato Pizza",
        yellow: "Baked Potato with Beans and Cheese or Tuna Mayo and Coleslaw",
      },
      vegetables: "Broccoli and Salad Bar",
    },
    thursday: {
      soupOrDessert: "Vanilla Ice Cream",
      mains: {
        red: "Chicken Curry with Boiled Rice",
        blue: "Quorn Dippers with Mash Potato",
        yellow: "Chicken Sandwich and Coleslaw",
      },
      vegetables: "Baked Beans, Mixed Veg and Salad Bar",
    },
    friday: {
      soupOrDessert: "Lentil Soup",
      mains: {
        red: "Sustainable Fish and Chips, Tomato Sauce",
        blue: "Omelette with Chips",
        yellow: "Cheese Wrap with Chips",
      },
      vegetables: "Peas and Salad Bar",
    },
  },
  3: {
    monday: {
      soupOrDessert: "Lentil Soup",
      mains: {
        red: "Roast Quorn Fillet with Gravy, Diced Potato and Yorkshire Pudding",
        blue: "Cheese and Tomato Pizza",
        yellow: "Baked Potato with Cheese or Tuna Mayo and Coleslaw",
      },
      vegetables: "Broccoli and Salad Bar",
    },
    tuesday: {
      soupOrDessert: "Carrot Cake",
      mains: {
        red: "Cheese or Beef Burger in a Bun with Potato Wedges, Tomato Sauce",
        blue: "Tomato, Pepper and Basil Pasta with Potato Wedges",
        yellow: "Cheese Sandwich and Coleslaw",
      },
      vegetables: "Sweetcorn and Salad Bar",
    },
    wednesday: {
      soupOrDessert: "Tomato Soup",
      mains: {
        red: "Mince Pie with Diced Potatoes",
        blue: "Macaroni Cheese",
        yellow: "Baked Potato with Cheese or Tuna Mayo and Coleslaw",
      },
      vegetables: "Mixed Vegetables and Salad Bar",
    },
    thursday: {
      soupOrDessert: "Vanilla Ice Cream",
      mains: {
        red: "Chicken Meatballs in Tomato Sauce with Pasta",
        blue: "Bubble Salmon with Mash Potato",
        yellow: "Chicken Sandwich and Coleslaw",
      },
      vegetables: "Carrots and Salad Bar",
    },
    friday: {
      soupOrDessert: "Lentil Soup",
      mains: {
        red: "Sustainable Breaded Fish and Chips, Tomato Sauce",
        blue: "Vegan Sausage Roll with Chips",
        yellow: "Cheese Wrap with Chips",
      },
      vegetables: "Peas and Salad Bar",
    },
  },
};

// "Week Commencing" Mondays from each screenshot, ISO yyyy-mm-dd.
const weekCommencing = {
  1: [
    "2026-08-17",
    "2026-09-07",
    "2026-09-28",
    "2026-10-19",
    "2026-11-09",
    "2026-11-30",
    "2026-12-21",
    "2027-01-18",
    "2027-02-08",
    "2027-03-01",
    "2027-03-22",
    "2027-05-03",
    "2027-05-24",
    "2027-06-14",
  ],
  2: [
    "2026-08-24",
    "2026-09-14",
    "2026-10-05",
    "2026-10-26",
    "2026-11-16",
    "2026-12-07",
    "2027-01-04",
    "2027-01-25",
    "2027-02-15",
    "2027-03-08",
    "2027-03-29",
    "2027-04-19",
    "2027-05-10",
    "2027-05-31",
    "2027-06-21",
  ],
  3: [
    "2026-08-31",
    "2026-09-21",
    "2026-11-02",
    "2026-11-23",
    "2026-12-14",
    "2027-01-11",
    "2027-02-01",
    "2027-02-22",
    "2027-03-15",
    "2027-04-26",
    "2027-05-17",
    "2027-06-07",
    "2027-06-28",
  ],
};

const isoDatePlusDays = (isoDate, days) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const days = {};
for (const [week, mondays] of Object.entries(weekCommencing)) {
  for (const monday of mondays) {
    if (new Date(`${monday}T00:00:00Z`).getUTCDay() !== 1) {
      throw new Error(`Week ${week} commencing date is not a Monday: ${monday}`);
    }
    WEEKDAYS.forEach((weekday, offset) => {
      const date = isoDatePlusDays(monday, offset);
      if (days[date]) {
        throw new Error(`Date covered by two menu weeks: ${date}`);
      }
      days[date] = { week: Number(week), ...menus[week][weekday] };
    });
  }
}

const sorted = Object.fromEntries(
  Object.entries(days).sort(([a], [b]) => a.localeCompare(b)),
);

const output = {
  comment:
    "Generated by scripts/generate-lunch-menu.mjs - edit that script, not this file. Dates with no entry (weekends, school holidays) have no school lunch.",
  days: sorted,
};

const target = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lunchMenu.json",
);
writeFileSync(target, JSON.stringify(output, null, 2) + "\n");
console.log(
  `Wrote ${Object.keys(sorted).length} days across ${
    Object.values(weekCommencing).flat().length
  } school weeks to ${target}`,
);

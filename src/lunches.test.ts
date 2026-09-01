import { lunchOptionsFor } from "./lunches";

describe("lunch options", () => {
  it("resolves a school day to its rotation week's menu", () => {
    // Tuesday in the week commencing 31st Aug 2026 = Week 3
    const options = lunchOptionsFor(new Date("2026-09-01T08:00:00"));

    expect(options?.week).toBe(3);
    expect(options?.soupOrDessert).toBe("Carrot Cake");
    expect(options?.mains.blue).toBe(
      "Tomato, Pepper and Basil Pasta with Potato Wedges",
    );
  });

  it("uses the local calendar date, not UTC", () => {
    // Late evening local time must still be the same menu day
    const options = lunchOptionsFor(new Date("2026-09-01T23:30:00"));
    expect(options?.soupOrDessert).toBe("Carrot Cake");
  });

  it("has no options during school holidays", () => {
    // October week: no menu week commences 12th Oct 2026
    expect(lunchOptionsFor(new Date("2026-10-12T08:00:00"))).toBeUndefined();
  });

  it("has no options at weekends", () => {
    expect(lunchOptionsFor(new Date("2026-09-05T08:00:00"))).toBeUndefined();
  });
});

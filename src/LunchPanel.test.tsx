import React from "react";
import { render, screen } from "@testing-library/react";
import LunchPanel from "./LunchPanel";

describe("lunch panel", () => {
  it("shows the three mains for a school day", () => {
    // Tuesday, week commencing 31st Aug 2026 = Week 3
    render(
      <LunchPanel date={new Date("2026-09-01T08:00:00")} title="Lunch today" />,
    );

    expect(
      screen.getByText("Cheese or Beef Burger in a Bun with Potato Wedges, Tomato Sauce"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tomato, Pepper and Basil Pasta with Potato Wedges"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cheese Sandwich and Coleslaw")).toBeInTheDocument();
    expect(screen.getByText(/Carrot Cake/)).toBeInTheDocument();
  });

  it("says so when there is no school lunch", () => {
    // October holiday week
    render(
      <LunchPanel date={new Date("2026-10-12T08:00:00")} title="Lunch today" />,
    );

    expect(screen.getByText(/No school lunch/)).toBeInTheDocument();
  });
});

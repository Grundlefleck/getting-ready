import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("week menu popup", () => {
  it("shows the current week's meals over the swimlanes and closes cleanly", () => {
    // Tuesday 1st Sept 2026, week commencing 31st Aug = Week 3
    window.history.replaceState(
      {},
      "",
      "/?fixCurrentTime=2026-09-01T08:00:00",
    );
    render(<App />);

    // Not shown until asked for
    expect(screen.queryByText(/Week commencing/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Week menu/));

    expect(screen.getByText(/Week commencing 31 Aug 2026/)).toBeInTheDocument();
    // Week 3 Monday's red main, only visible in the popup
    expect(
      screen.getByText(
        "Roast Quorn Fillet with Gravy, Diced Potato and Yorkshire Pudding",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(/next week/));

    expect(screen.getByText(/Week commencing 7 Sep 2026/)).toBeInTheDocument();
    // Week 1 Monday's red main
    expect(
      screen.getByText("Quorn Katsu Curry with Boiled Rice"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close week menu"));

    expect(screen.queryByText(/Week commencing/)).not.toBeInTheDocument();
    // Today's lunch in the bottom bar is untouched throughout
    expect(screen.getByText(/Lunch today/)).toBeInTheDocument();
    expect(screen.getByText(/Carrot Cake/)).toBeInTheDocument();
  });
});

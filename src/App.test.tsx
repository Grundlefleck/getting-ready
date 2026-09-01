import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "./App";
import { config } from "./config";

beforeEach(() => {
  localStorage.clear();
  // Tuesday 1st Sept 2026, week commencing 31st Aug = Week 3
  window.history.replaceState({}, "", "/?fixCurrentTime=2026-09-01T08:00:00");
});

describe("week menu popup", () => {
  it("shows the current week's meals and activities over the swimlanes and closes cleanly", () => {
    render(<App />);

    expect(screen.queryByText(/Week commencing/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Week menu/));

    expect(screen.getByText(/Week commencing 31 Aug 2026/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Roast Quorn Fillet with Gravy, Diced Potato and Yorkshire Pudding",
      ),
    ).toBeInTheDocument();
    // Jacob has PE on Tuesday and Thursday, Outdoor learning on Wednesday
    expect(screen.getAllByText(/Jacob 🤸 PE/)).toHaveLength(2);
    expect(screen.getAllByText(/Jacob 🌳 Outdoor/)).toHaveLength(1);

    fireEvent.click(screen.getByText(/next week/));

    expect(screen.getByText(/Week commencing 7 Sep 2026/)).toBeInTheDocument();
    expect(
      screen.getByText("Quorn Katsu Curry with Boiled Rice"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close week menu"));

    expect(screen.queryByText(/Week commencing/)).not.toBeInTheDocument();
    expect(screen.getByText(/Lunch today/)).toBeInTheDocument();
    expect(screen.getByText(/Carrot Cake/)).toBeInTheDocument();
  });
});

describe("completing a lane", () => {
  it("celebrates full-screen when a child finishes every task", () => {
    render(<App />);

    expect(screen.queryByTestId("celebration")).not.toBeInTheDocument();

    config[0].tasks.forEach((task) => {
      fireEvent.click(screen.getAllByText(task.name)[0]);
    });

    expect(screen.getByTestId("celebration")).toBeInTheDocument();
    expect(screen.getByText(/Well done Jacob!/)).toBeInTheDocument();
  });

  it("queues celebrations when two kids finish together", () => {
    jest.useFakeTimers();
    render(<App />);

    config[1].tasks.forEach((task) => {
      fireEvent.click(screen.getAllByText(task.name)[1]);
    });
    config[2].tasks.forEach((task) => {
      fireEvent.click(screen.getAllByText(task.name)[2]);
    });

    expect(screen.getByText(/Well done Calum!/)).toBeInTheDocument();
    expect(screen.queryByText(/Well done Dylan!/)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4100);
    });
    expect(screen.queryByText(/Well done Calum!/)).not.toBeInTheDocument();
    expect(screen.getByText(/Well done Dylan!/)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4100);
    });
    expect(screen.queryByText(/Well done/)).not.toBeInTheDocument();
    jest.useRealTimers();
  });
});

describe("long-press to uncheck", () => {
  it("removes a check after a long press and does not re-add it on the click", () => {
    jest.useFakeTimers();
    render(<App />);

    const calumWashFace = screen.getAllByText("Wash face")[1];
    fireEvent.click(calumWashFace);
    expect(calumWashFace).toHaveClass("font-bold");

    fireEvent.pointerDown(calumWashFace);
    act(() => {
      jest.advanceTimersByTime(700);
    });
    fireEvent.pointerUp(calumWashFace);
    fireEvent.click(calumWashFace);

    expect(calumWashFace).not.toHaveClass("font-bold");
    jest.useRealTimers();
  });

  it("a short press still checks the task", () => {
    jest.useFakeTimers();
    render(<App />);

    const dylanWashFace = screen.getAllByText("Wash face")[2];
    fireEvent.pointerDown(dylanWashFace);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    fireEvent.pointerUp(dylanWashFace);
    fireEvent.click(dylanWashFace);

    expect(dylanWashFace).toHaveClass("font-bold");
    jest.useRealTimers();
  });
});

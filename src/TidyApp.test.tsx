import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import TidyApp from "./TidyApp";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(
    {},
    "",
    "/tidy?fixCurrentTime=2026-11-19T16:00:00",
  );
});

const tap = (label: string) => fireEvent.click(screen.getByLabelText(label));

describe("tidy up", () => {
  it("opens on the Before karate jobs with an empty jar", () => {
    render(<TidyApp />);

    expect(screen.getByText("Collect coat hangers")).toBeInTheDocument();
    expect(screen.getByText("Lay out karate gear")).toBeInTheDocument();
    expect(screen.queryAllByTestId("marble")).toHaveLength(0);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("drops marbles as kids count, and celebrates when every job is done", () => {
    jest.useFakeTimers();
    render(<TidyApp />);

    tap("Jacob: Collect coat hangers");
    tap("Jacob: Collect coat hangers");
    tap("Calum: Collect coat hangers");
    expect(screen.getByText("3 so far")).toBeInTheDocument();
    fireEvent.click(screen.getByText("That's all of them"));
    expect(screen.getAllByTestId("marble")).toHaveLength(6);

    tap("Calum: Pyjamas to bedroom");
    tap("Dylan: Pyjamas to bedroom");
    fireEvent.click(screen.getByText("Done!"));

    ["Jacob", "Calum", "Dylan"].forEach((child) => {
      tap(`${child}: Hang up shoes & coats`);
      tap(`${child}: Own stuff off the floor`);
      tap(`${child}: Lay out karate gear`);
    });

    expect(screen.getAllByTestId("marble")).toHaveLength(30);
    expect(screen.getByTestId("celebration")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4100);
    });
    expect(
      screen.getByText(/Jacob: Most jobs|Calum: Most jobs|Dylan: Most jobs/),
    ).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("long-press on a face takes a count back off", () => {
    jest.useFakeTimers();
    render(<TidyApp />);

    tap("Calum: Collect coat hangers");
    tap("Calum: Collect coat hangers");
    const face = screen.getByLabelText("Calum: Collect coat hangers");
    fireEvent.pointerDown(face);
    act(() => {
      jest.advanceTimersByTime(700);
    });
    fireEvent.pointerUp(face);
    fireEvent.click(face);

    expect(screen.getByText("1 so far")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("keeps today's progress across a reload", () => {
    const { unmount } = render(<TidyApp />);
    tap("Dylan: Lay out karate gear");
    unmount();

    render(<TidyApp />);
    expect(screen.getByText("1 / 3 done")).toBeInTheDocument();
  });
});

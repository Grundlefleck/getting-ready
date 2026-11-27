import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import TidyApp from "./TidyApp";

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(Math, "random").mockReturnValue(0);
  window.history.replaceState(
    {},
    "",
    "/tidy?fixCurrentTime=2026-11-19T16:00:00",
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

const tap = (label: string) => fireEvent.click(screen.getByLabelText(label));
const click = (text: string) => fireEvent.click(screen.getByText(text));

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

  it("can show the mess monster instead, which takes a hit per marble", () => {
    render(<TidyApp />);
    click("✏️ Jobs");
    click("👾 Mess monster");
    click("Done");

    tap("Jacob: Lay out karate gear");
    tap("Calum: Lay out karate gear");

    expect(screen.getByTestId("monster")).toBeInTheDocument();
    expect(screen.getAllByTestId("hit")).toHaveLength(4);
    expect(screen.queryAllByTestId("marble")).toHaveLength(0);
  });

  it("picks the reward at random on a new day", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.9);
    render(<TidyApp />);

    expect(screen.getByTestId("monster")).toBeInTheDocument();
  });

  it("edits a job's kind and deletes jobs, remembering both", () => {
    const { unmount } = render(<TidyApp />);
    click("✏️ Jobs");

    tap("Edit Pyjamas to bedroom");
    fireEvent.change(screen.getByLabelText("Kind of job"), {
      target: { value: "each" },
    });
    click("Save");

    tap("Edit Lay out karate gear");
    click("Delete");
    click("Done");
    unmount();

    render(<TidyApp />);
    expect(screen.getAllByText("0 / 3 done")).toHaveLength(3);
    expect(screen.queryByText("Lay out karate gear")).not.toBeInTheDocument();
    click("✏️ Jobs");
    expect(screen.queryByText("Lay out karate gear")).not.toBeInTheDocument();
  });

  it("remembers the chosen celebration", () => {
    const { unmount } = render(<TidyApp />);
    click("✏️ Jobs");
    expect(screen.getByText("🎲 Random")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    click("🔥 Fire");
    unmount();

    render(<TidyApp />);
    click("✏️ Jobs");
    expect(screen.getByText("🔥 Fire")).toHaveAttribute("aria-pressed", "true");
  });

  it("adds a job with an emoji picked from the grid", () => {
    render(<TidyApp />);
    click("✏️ Jobs");

    tap("Emoji");
    fireEvent.click(screen.getByRole("button", { name: "📚" }));
    fireEvent.change(screen.getByLabelText("Job name"), {
      target: { value: "Books on the shelf" },
    });
    click("Add");
    click("Done");

    expect(screen.getByText("Books on the shelf")).toBeInTheDocument();
    expect(screen.getAllByText("📚").length).toBeGreaterThan(0);
  });
});

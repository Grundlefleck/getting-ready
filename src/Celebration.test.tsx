import React from "react";
import { act, render, screen } from "@testing-library/react";
import CelebrationOverlay from "./Celebration";

describe("celebration", () => {
  it("keeps the fire going for longer than the other effects", () => {
    jest.useFakeTimers();
    const confettiDone = jest.fn();
    const fireDone = jest.fn();
    render(
      <CelebrationOverlay
        message="A"
        effect="confetti"
        onDone={confettiDone}
      />,
    );
    render(<CelebrationOverlay message="B" effect="fire" onDone={fireDone} />);

    act(() => {
      jest.advanceTimersByTime(4100);
    });
    expect(confettiDone).toHaveBeenCalled();
    expect(fireDone).not.toHaveBeenCalled();
    expect(screen.getByText("B")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(fireDone).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

import React, { useRef } from "react";

const LONG_PRESS_MILLIS = 600;

export const useLongPress = () => {
  const timer = useRef<number>();
  const fired = useRef(false);
  const cancel = () => window.clearTimeout(timer.current);

  return (onTap: () => void, onLongPress: () => void) => ({
    onPointerDown: () => {
      fired.current = false;
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, LONG_PRESS_MILLIS);
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      onTap();
    },
  });
};

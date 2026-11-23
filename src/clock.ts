import { useEffect, useState } from "react";

export const overrideCurrentTime = (): Date => {
  const params = new URLSearchParams(window.location.search);
  const fixedTime = params.get("fixCurrentTime");

  if (fixedTime) {
    const parsedTime = new Date(fixedTime);
    return isNaN(parsedTime.getTime()) ? new Date() : parsedTime;
  }
  return new Date();
};

export const useCurrentTime = (): Date => {
  const [currentTime, setCurrentTime] = useState(overrideCurrentTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(overrideCurrentTime);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return currentTime;
};

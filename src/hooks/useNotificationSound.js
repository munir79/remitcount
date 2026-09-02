"use client";
import { useCallback, useState } from "react";

export const useNotificationSound = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const playSound = useCallback(() => {
    if (!isSoundEnabled) return;

    try {
      const audio = new Audio();
      audio.src = "/sounds/notification.mp3";
      audio.volume = 1.0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Sound play failed:", error);
        });
      }
    } catch (error) {
      console.error("Sound error:", error);
    }
  }, [isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => !prev);
  }, []);

  return { playSound, isSoundEnabled, toggleSound };
};
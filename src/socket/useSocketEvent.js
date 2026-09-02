"use client";

import { useEffect } from "react";
import { getSocket } from "./socket";

export const useSocketEvent = (eventName, handler) => {
  useEffect(() => {
    let activeSocket = null;
    let intervalId = null;

    const attachListener = (socket) => {
      activeSocket = socket;
      socket.on(eventName, handler);
    };

    const existingSocket = getSocket();

    if (existingSocket) {
      attachListener(existingSocket);
    } else {
      intervalId = setInterval(() => {
        const socket = getSocket();
        if (socket) {
          clearInterval(intervalId);
          intervalId = null;
          attachListener(socket);
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (activeSocket) activeSocket.off(eventName, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);
};
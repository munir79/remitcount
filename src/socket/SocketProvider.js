"use client";

import { useEffect } from "react";
import { initSocket } from "./socket";

/**
 * SocketProvider - App-এর root level-এ wrap করতে হবে
 * এটা login-এর সাথে সাথে socket initialize করে
 */
const SocketProvider = ({ children }) => {
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      initSocket(token);
    }

    return () => {
      // disconnectSocket(); // optionally disconnect on unmount
    };
  }, []);

  return children;
};

export default SocketProvider;
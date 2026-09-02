import { socketUri } from "@/utils/url";
import io from "socket.io-client";

let socket = null;

/**
 * Socket Initialize করা
 * JWT token পাঠাচ্ছি auth-এর জন্য
 */
export const initSocket = (token) => {
  console.log("Initializing socket with token:", token);

  if (socket?.connected) {
    console.log("🔌 Socket already connected");
    return socket;
  }

  socket = io(socketUri, {
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ Socket error:", error);
  });

  return socket;
};

/**
 * Socket instance পাওয়া
 */
export const getSocket = () => socket;

/**
 * Socket disconnect করা
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket disconnected and cleaned up");
  }
};
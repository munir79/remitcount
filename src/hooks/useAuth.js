"use client";
import { useSyncExternalStore } from "react";

const AUTH_EVENT = "auth-storage-change";
const KEYS = ["accessToken", "user", "permissions"];

// Server Render এ (localStorage নেই) এই Snapshot — isInitializing: true
const SERVER_SNAPSHOT = { isInitializing: true, isAuthenticated: false, user: null, permissions: [] };
const LOGGED_OUT = { isInitializing: false, isAuthenticated: false, user: null, permissions: [] };

let cachedRaw = null;
let cachedSnapshot = LOGGED_OUT;

/**
 * ✅ localStorage থেকে Auth পড়া — Raw String না বদলালে একই Object ফেরত দেয়
 * (useSyncExternalStore এর নিয়ম: একই Data হলে Snapshot এর Reference একই থাকতে হবে)
 */
const readSnapshot = () => {
  let raw;
  try {
    raw = KEYS.map((k) => localStorage.getItem(k) ?? "").join("\u0000");
  } catch {
    return LOGGED_OUT; // Private Mode / Storage Block
  }
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;

  const token = localStorage.getItem("accessToken");
  const storedUser = localStorage.getItem("user");
  const storedPermissions = localStorage.getItem("permissions");

  if (!token || !storedUser) {
    cachedSnapshot = LOGGED_OUT;
    return cachedSnapshot;
  }

  try {
    cachedSnapshot = {
      isInitializing: false,
      isAuthenticated: true,
      user: JSON.parse(storedUser),
      permissions: storedPermissions ? JSON.parse(storedPermissions) : [],
    };
  } catch {
    // নষ্ট Data — Logout এর মতো ধরা হয়
    cachedSnapshot = LOGGED_OUT;
  }
  return cachedSnapshot;
};

// অন্য Tab এ Login/Logout (storage event) বা এই Tab এ logout() — সব useAuth একসাথে Update
const subscribe = (callback) => {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT, callback);
  };
};

export const notifyAuthChange = () => window.dispatchEvent(new Event(AUTH_EVENT));

export const useAuth = () => {
  const { user, permissions, isAuthenticated, isInitializing } = useSyncExternalStore(subscribe, readSnapshot, () => SERVER_SNAPSHOT);

  const logout = () => {
    KEYS.forEach((k) => localStorage.removeItem(k));
    notifyAuthChange();
  };

  const hasPermission = (key) => permissions.includes(key);

  return { user, permissions, isAuthenticated, isInitializing, logout, hasPermission };
};

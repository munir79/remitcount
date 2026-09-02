"use client";
import { useState, useEffect } from "react";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    const storedPermissions = localStorage.getItem("permissions");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("permissions");
      }
    }

    setIsInitializing(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
  };

  const hasPermission = (key) => permissions.includes(key);

  return { user, permissions, isAuthenticated, isInitializing, logout, hasPermission };
};
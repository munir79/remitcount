"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { disconnectSocket } from "@/socket/socket";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-neutral-200 bg-white px-6">
      <NotificationBell />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
            <p className="text-xs text-neutral-500">{user?.email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
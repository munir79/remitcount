"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import NotificationBell from "./NotificationBell";
import Avatar from "../ui/Avatar";
import { disconnectSocket } from "@/socket/socket";
import { useAuth } from "@/hooks/useAuth";
import { navigationConfig } from "@/lib/navigation";

// বর্তমান URL থেকে Navigation Config দেখে Section ও Page এর নাম বের করা (Breadcrumb এর জন্য)
const useCurrentPageMeta = (pathname) =>
  useMemo(() => {
    let best = null;
    for (const group of navigationConfig) {
      for (const item of group.items) {
        const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
        if (matches && (!best || item.href.length > best.item.href.length)) best = { group, item };
      }
    }
    return best ? { section: best.group.section, label: best.item.label } : null;
  }, [pathname]);

const Header = ({ onMenuClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const pageMeta = useCurrentPageMeta(pathname);

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
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        {pageMeta && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 truncate text-sm">
            {pageMeta.section && (
              <>
                <span className="hidden text-slate-400 sm:inline">{pageMeta.section}</span>
                <span className="hidden text-slate-300 sm:inline">/</span>
              </>
            )}
            <span className="truncate font-medium text-slate-800">{pageMeta.label}</span>
          </nav>
        )}
      </div>

      <NotificationBell />

      <div className="h-6 w-px bg-slate-200" />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100"
        >
          <Avatar name={user?.name || "User"} size="sm" />
          <div className="hidden text-left leading-tight md:block">
            <p className="max-w-[160px] truncate text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="max-w-[160px] truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 z-50 mt-2 w-60 animate-pop-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-elevated">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

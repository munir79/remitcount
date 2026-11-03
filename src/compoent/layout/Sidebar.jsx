"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import SidebarItem from "./SidebarItem";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { navigationConfig } from "@/lib/navigation";
import { APP_INITIAL, APP_NAME, APP_TAGLINE } from "@/lib/brand";

const Brand = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 ring-1 ring-inset ring-white/20">
      {APP_INITIAL}
    </div>
    <div className="min-w-0 leading-tight">
      <p className="truncate text-[15px] font-semibold text-white">{APP_NAME}</p>
      <p className="truncate text-[11px] text-slate-400">{APP_TAGLINE}</p>
    </div>
  </div>
);

/**
 * ✅ Desktop এ সবসময় বামে থাকে, Mobile/Tablet এ Header এর Menu Button চাপলে Drawer হিসেবে খোলে
 */
const Sidebar = ({ isMobileOpen = false, onMobileClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission, permissions, isInitializing } = useAuth();

  const groupsWithVisibleItems = useMemo(() => {
    return navigationConfig.map((group) => ({
      ...group,
      visibleItems: group.items.filter(
        (item) => !item.requiredPermission || isInitializing || hasPermission(item.requiredPermission)
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions, isInitializing]);

  const accountingGroups = groupsWithVisibleItems.filter((g) => g.workspace === "accounting" && g.visibleItems.length > 0);
  const posGroups = groupsWithVisibleItems.filter((g) => g.workspace === "pos" && g.visibleItems.length > 0);

  const hasAccountingAccess = accountingGroups.length > 0;
  const hasPosAccess = posGroups.length > 0;
  const showSwitcher = hasAccountingAccess && hasPosAccess;

  const [activeWorkspace, setActiveWorkspace] = useState(null);

  useEffect(() => {
    if (!isInitializing && activeWorkspace === null) {
      if (hasPosAccess) setActiveWorkspace("pos");
      else if (hasAccountingAccess) setActiveWorkspace("accounting");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitializing, hasPosAccess, hasAccountingAccess]);

  useEffect(() => {
    if (isInitializing) return;
    const isOnPosRoute = pathname.startsWith("/pos");
    if (isOnPosRoute && activeWorkspace !== "pos" && hasPosAccess) {
      setActiveWorkspace("pos");
    } else if (!isOnPosRoute && activeWorkspace === "pos" && hasAccountingAccess) {
      const isAccountingRoute = accountingGroups.some((g) => g.visibleItems.some((item) => pathname.startsWith(item.href)));
      if (isAccountingRoute) setActiveWorkspace("accounting");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleWorkspaceChange = (workspace) => {
    setActiveWorkspace(workspace);
    onMobileClose?.();
    router.push(workspace === "pos" ? "/pos" : "/dashboard");
  };

  const visibleGroups = activeWorkspace === "pos" ? posGroups : accountingGroups;

  const content = (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Brand />
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {showSwitcher && (
        <div className="px-4 pb-2">
          <WorkspaceSwitcher activeWorkspace={activeWorkspace} onChange={handleWorkspaceChange} />
        </div>
      )}

      <nav className="scrollbar-dark flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group, idx) => (
          <div key={idx}>
            {group.section && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{group.section}</p>
            )}
            <div className="space-y-0.5">
              {group.visibleItems.map((item) => (
                <SidebarItem key={item.href} {...item} onNavigate={onMobileClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-800 px-5 py-4">
        <p className="text-[11px] text-slate-400">Base currency · MYR</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>

      {/* Mobile / Tablet Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 animate-fade-in bg-slate-950/60 backdrop-blur-[2px]" onClick={onMobileClose} />
          <aside className="relative h-full w-72 max-w-[85vw] animate-slide-in-left shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;

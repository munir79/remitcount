

"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import SidebarItem from "./SidebarItem";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { navigationConfig } from "@/lib/navigation";

const Sidebar = () => {
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
    router.push(workspace === "pos" ? "/pos" : "/dashboard");
  };

  const visibleGroups = activeWorkspace === "pos" ? posGroups : accountingGroups;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
          A
        </div>
        <span className="text-lg font-semibold text-neutral-900">AccountSaaS</span>
      </div>

      {showSwitcher && (
        <div className="border-b border-neutral-200 px-3 py-3">
          <WorkspaceSwitcher activeWorkspace={activeWorkspace} onChange={handleWorkspaceChange} />
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group, idx) => (
          <div key={idx}>
            {group.section && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">{group.section}</p>
            )}
            <div className="space-y-1">
              {group.visibleItems.map((item) => (
                <SidebarItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
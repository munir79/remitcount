"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarItem = ({ label, href, icon: Icon, onNavigate }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/pos" && href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
        isActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {Icon && (
        <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
      )}
      <span className="truncate">{label}</span>
    </Link>
  );
};

export default SidebarItem;

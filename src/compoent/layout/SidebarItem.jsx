"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarItem = ({ label, href, icon: Icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/pos" && href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
        isActive ? "bg-indigo-50 text-indigo-700" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {label}
    </Link>
  );
};

export default SidebarItem;
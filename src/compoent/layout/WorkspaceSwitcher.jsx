"use client";
import { Building2, Coins } from "lucide-react";

const WorkspaceSwitcher = ({ activeWorkspace, onChange }) => {
  return (
    <div className="flex gap-1 rounded-md bg-neutral-100 p-1">
      <button
        onClick={() => onChange("pos")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
          activeWorkspace === "pos" ? "bg-white text-indigo-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
        }`}
      >
        <Coins className="h-3.5 w-3.5" />
        POS
      </button>
      <button
        onClick={() => onChange("accounting")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
          activeWorkspace === "accounting" ? "bg-white text-indigo-700 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
        }`}
      >
        <Building2 className="h-3.5 w-3.5" />
        Accounting
      </button>
    </div>
  );
};

export default WorkspaceSwitcher;
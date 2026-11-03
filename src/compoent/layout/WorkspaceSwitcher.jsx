"use client";
import { Building2, Coins } from "lucide-react";

const OPTIONS = [
  { value: "pos", label: "POS", icon: Coins },
  { value: "accounting", label: "Accounting", icon: Building2 },
];

const WorkspaceSwitcher = ({ activeWorkspace, onChange }) => {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = activeWorkspace === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              isActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default WorkspaceSwitcher;

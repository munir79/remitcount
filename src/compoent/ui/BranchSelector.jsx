"use client";

import { useGetAllBranchesQuery } from "@/redux/features/branch/branchApi";
import Select from "./Select";

/** label={null} দিলে Label ছাড়া Compact (Toolbar এর জন্য) */
const BranchSelector = ({ branch, onBranchChange, className = "", label = "Branch" }) => {
  const { data } = useGetAllBranchesQuery({ limit: 100 });
  const branches = data?.data?.data || [];

  if (branches.length === 0) return null; // একটাও Branch না থাকলে Selector দেখানোর দরকার নাই

  return (
    <Select
      id="branchFilter"
      label={label || undefined}
      aria-label="Branch"
      value={branch}
      onChange={(e) => onBranchChange(e.target.value)}
      className={className}
    >
      <option value="">All branches</option>
      {branches.map((b) => (
        <option key={b._id} value={b._id}>
          {b.name}
        </option>
      ))}
    </Select>
  );
};

export default BranchSelector;

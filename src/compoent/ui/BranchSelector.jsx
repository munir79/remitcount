"use client";

import { useGetAllBranchesQuery } from "@/redux/features/branch/branchApi";
import Select from "./Select";


const BranchSelector = ({ branch, onBranchChange, className = "" }) => {
  const { data } = useGetAllBranchesQuery({ limit: 100 });
  const branches = data?.data?.data || [];

  if (branches.length === 0) return null; // একটাও Branch না থাকলে Selector দেখানোর দরকার নাই

  return (
    <Select id="branchFilter" label="Branch" value={branch} onChange={(e) => onBranchChange(e.target.value)} className={className}>
      <option value="">All Branches (Company-wide)</option>
      {branches.map((b) => (
        <option key={b._id} value={b._id}>
          {b.name} {b.staffCount !== undefined ? `(${b.staffCount} staff)` : ""}
        </option>
      ))}
    </Select>
  );
};

export default BranchSelector;
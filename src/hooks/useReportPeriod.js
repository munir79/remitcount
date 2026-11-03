"use client";
import { useState } from "react";
import { formatDate } from "@/lib/format";

/**
 * ✅ Report Page এর Period + Branch State
 * custom হলে দুটো তারিখ না দেওয়া পর্যন্ত Query Skip হয়
 */
export const useReportPeriod = (initialPeriod = "month") => {
  const [period, setPeriod] = useState(initialPeriod);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branch, setBranch] = useState("");

  const isCustom = period === "custom";
  const params = { ...(isCustom ? { fromDate, toDate } : { period }), branch: branch || undefined };
  const skip = isCustom && (!fromDate || !toDate);

  return { period, setPeriod, fromDate, setFromDate, toDate, setToDate, branch, setBranch, params, skip };
};

/** Backend এর dateRange ({ $gte, $lte }) থেকে "01 Oct 2026 – 31 Oct 2026" */
export const formatRangeLabel = (dateRange) => {
  if (!dateRange) return "";
  const from = dateRange.$gte ? formatDate(dateRange.$gte) : "Beginning";
  const to = dateRange.$lte ? formatDate(dateRange.$lte) : "Today";
  return `${from} – ${to}`;
};

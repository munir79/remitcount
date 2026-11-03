"use client";
import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZES = [15, 30, 50, 100];

const EMPTY = { search: "", branch: "", period: "", fromDate: "", toDate: "", extra: {} };

const cleanExtra = (extra) => Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== "" && v !== undefined && v !== null));
const normalize = (f) => ({ ...f, search: f.search.trim(), extra: cleanExtra(f.extra) });
const sameFilters = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

/** তারিখ ঠিক আছে কিনা — ভুল থাকলে Apply হয় না */
const dateError = (f) => {
  if (f.period !== "custom") return "";
  if (!f.fromDate && !f.toDate) return "Pick a date — for one day, use the same date in both boxes";
  if (f.fromDate && f.toDate && f.fromDate > f.toDate) return "The 'from' date is after the 'to' date";
  return "";
};

/**
 * ✅ সব List Page এর Filter State এক জায়গায় — Page, Page Size, Search, Status, Branch, Period,
 * নির্দিষ্ট তারিখ (period "custom" → fromDate / toDate), আর Page এর নিজস্ব Filter (extra — যেমন Send এ Currency)
 *
 * manualApply: false (আগের মতো) — বাছাই করলেই Filter হয় (Search Debounced)
 * manualApply: true — বাছাই শুধু Draft এ থাকে; "Apply" বা Enter চাপলে তবেই Filter হয় (ভুল তারিখে Apply হয় না)
 * Status Tab, Page, Page Size সবসময় সাথে সাথে
 *
 * const filters = useListFilters(); useGetAllBuyCurrencyQuery(filters.params)
 */
export const useListFilters = ({ limit: defaultLimit = 15, debounceMs = 350, manualApply = false } = {}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimitRaw] = useState(defaultLimit);
  const [status, setStatusRaw] = useState("");
  const [draft, setDraft] = useState(EMPTY); // যা Screen এ বাছা আছে
  const [applied, setApplied] = useState(EMPTY); // যা দিয়ে আসলে Data আনা হচ্ছে

  // Auto Mode এ Search টাইপ থামার পর Filter হয়
  useEffect(() => {
    if (manualApply) return undefined;
    const timer = setTimeout(() => {
      setApplied((prev) => (prev.search === draft.search.trim() ? prev : { ...prev, search: draft.search.trim() }));
      setPage(1);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [draft.search, debounceMs, manualApply]);

  const update = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    if (!manualApply && !("search" in patch)) {
      setApplied((prev) => ({ ...prev, ...patch }));
      setPage(1);
    }
  };

  const error = dateError(draft);
  const isDirty = manualApply && !sameFilters(draft, applied);

  /** Draft → Applied; তারিখ ভুল হলে false */
  const apply = () => {
    if (error) return false;
    setApplied(normalize(draft));
    setPage(1);
    return true;
  };

  const clearAll = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setStatusRaw("");
    setPage(1);
  };

  const params = useMemo(() => {
    const isCustom = applied.period === "custom";
    const hasDates = Boolean(applied.fromDate || applied.toDate);
    return {
      page,
      limit,
      search: applied.search || undefined,
      status: status || undefined,
      branch: applied.branch || undefined,
      // "custom" এ তারিখ না দিলে বা তারিখ উল্টো হলে তারিখের Filter নেই
      period: (isCustom ? (hasDates && !dateError(applied) ? "custom" : "") : applied.period) || undefined,
      fromDate: (isCustom && !dateError(applied) && applied.fromDate) || undefined,
      toDate: (isCustom && !dateError(applied) && applied.toDate) || undefined,
      ...cleanExtra(applied.extra),
    };
  }, [page, limit, status, applied]);

  return {
    params,
    page,
    setPage,
    limit,
    setLimit: (value) => {
      setLimitRaw(value);
      setPage(1);
    },
    status,
    setStatus: (value) => {
      setStatusRaw(value);
      setPage(1);
    },
    search: draft.search,
    setSearch: (value) => update({ search: value }),
    branch: draft.branch,
    setBranch: (value) => update({ branch: value }),
    period: draft.period,
    setPeriod: (value) => update({ period: value }),
    fromDate: draft.fromDate,
    setFromDate: (value) => update({ fromDate: value }),
    toDate: draft.toDate,
    setToDate: (value) => update({ toDate: value }),
    extra: draft.extra,
    setExtra: (key, value) => update({ extra: { ...draft.extra, [key]: value } }),
    manualApply,
    apply,
    isDirty,
    error,
    clearAll,
    hasActiveFilters: Boolean(status || params.search || params.branch || params.period || Object.keys(cleanExtra(applied.extra)).length),
  };
};

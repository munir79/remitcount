import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZES } from "@/hooks/useListFilters";

// বর্তমান Page এর আশেপাশের Page Number গুলো, মাঝে ফাঁক থাকলে "…"
const getPageItems = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const items = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });
  return items;
};

const navButton =
  "flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40";

/**
 * onLimitChange দিলে "প্রতি পাতায় 15 / 30 / 50 / 100" বাছা যায়
 */
const Pagination = ({ pagination, onPageChange, limit, onLimitChange }) => {
  if (!pagination) return null;
  const { page, totalPages, total } = pagination;
  const canChangeSize = Boolean(onLimitChange) && total > PAGE_SIZES[0];
  if (totalPages <= 1 && !canChangeSize) return null;
  const from = total === 0 ? 0 : (page - 1) * pagination.limit + 1;
  const to = Math.min(page * pagination.limit, total);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row print:hidden">
      <div className="flex items-center gap-3 text-[13px] text-slate-500">
        <span>
          Showing <span className="font-medium text-slate-700">{from}–{to}</span> of <span className="font-medium text-slate-700">{total}</span>
        </span>
        {canChangeSize && (
          <label className="flex items-center gap-1.5">
            <span>Per page</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {totalPages > 1 && (
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={!pagination.hasPrevPage} className={navButton}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        {getPageItems(page, totalPages).map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`h-8 min-w-8 rounded-lg px-2 text-[13px] font-medium tabular-nums transition ${
                item === page ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item}
            </button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={!pagination.hasNextPage} className={navButton}>
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      )}
    </div>
  );
};

export default Pagination;

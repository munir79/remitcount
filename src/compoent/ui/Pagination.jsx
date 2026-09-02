import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
      <span>
        Page {page} of {totalPages} — {total} total records
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!pagination.hasPrevPage}
          className="flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!pagination.hasNextPage}
          className="flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
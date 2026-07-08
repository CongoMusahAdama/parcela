"use client";

type StaffTablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function StaffTablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
}: StaffTablePaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-2.5 border-t border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
      <p className="font-body text-center text-[11px] text-muted sm:text-left sm:text-xs">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="font-display flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-semibold text-foreground disabled:opacity-40 sm:flex-none sm:py-1.5"
        >
          Previous
        </button>
        <span className="font-display shrink-0 text-[11px] font-semibold text-muted">
          {page}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="font-display flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[11px] font-semibold text-foreground disabled:opacity-40 sm:flex-none sm:py-1.5"
        >
          Next
        </button>
      </div>
    </div>
  );
}

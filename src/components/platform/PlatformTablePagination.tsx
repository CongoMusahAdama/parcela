"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PlatformTablePaginationProps = {
  currentPage: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function PlatformTablePagination({
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  totalItems,
  onPageChange,
  className,
}: PlatformTablePaginationProps) {
  if (totalItems === 0) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages =
    totalPages <= 5
      ? pageNumbers
      : pageNumbers.filter(
          (n) =>
            n === 1 ||
            n === totalPages ||
            Math.abs(n - currentPage) <= 1,
        );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/60 px-4 py-3 sm:px-5",
        className,
      )}
    >
      <p className="font-body text-xs text-stone-500">
        Showing{" "}
        <span className="font-semibold text-stone-800">{pageStart}</span>
        {" – "}
        <span className="font-semibold text-stone-800">{pageEnd}</span> of{" "}
        <span className="font-semibold text-stone-800">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors hover:border-[var(--platform-orange)]/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        {visiblePages.map((pageNumber, index) => {
          const prev = visiblePages[index - 1];
          const showEllipsis = prev !== undefined && pageNumber - prev > 1;
          return (
            <span key={pageNumber} className="flex items-center gap-1">
              {showEllipsis ? (
                <span className="px-1 font-body text-xs text-stone-400">…</span>
              ) : null}
              <button
                type="button"
                onClick={() => onPageChange(pageNumber)}
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                className={cn(
                  "font-display size-8 rounded-lg text-xs font-bold transition-colors",
                  pageNumber === currentPage
                    ? "bg-[var(--platform-orange)] text-white shadow-sm"
                    : "border border-stone-200 bg-white text-stone-700 hover:border-[var(--platform-orange)]/40",
                )}
              >
                {pageNumber}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex size-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition-colors hover:border-[var(--platform-orange)]/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function PlatformTableSnHeader() {
  return (
    <th className="font-display w-12 px-3 py-3 text-center font-bold">S/N</th>
  );
}

export function PlatformTableSnCell({ value }: { value: number }) {
  return (
    <td className="px-3 py-3.5 text-center">
      <span className="font-mono text-xs font-semibold text-stone-400">{value}</span>
    </td>
  );
}

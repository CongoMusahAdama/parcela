"use client";

import { useEffect, useMemo, useState } from "react";

export function usePlatformPagination<T>(
  items: T[],
  pageSize = 8,
  resetKey?: string | number,
) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize) || 1);
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  const pageStart = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, items.length);

  return {
    pageItems,
    currentPage,
    totalPages,
    setPage,
    pageStart,
    pageEnd,
    totalItems: items.length,
    pageSize,
  };
}

export function platformRowNumber(currentPage: number, pageSize: number, index: number) {
  return (currentPage - 1) * pageSize + index + 1;
}

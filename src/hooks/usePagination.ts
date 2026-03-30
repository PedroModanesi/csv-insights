import { useMemo } from 'react';
import { useCSVStore } from '../store/csvStore';
import type { CSVRow } from '../types/csv.types';

interface UsePaginationReturn {
  pageData: CSVRow[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export function usePagination(): UsePaginationReturn {
  const { filteredData, currentPage, pageSize } = useCSVStore();

  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);

    return { pageData, totalPages, startIndex, endIndex };
  }, [filteredData, currentPage, pageSize]);
}

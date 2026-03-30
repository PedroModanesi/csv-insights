import { useCSVStore } from '../../store/csvStore';
import { usePagination } from '../../hooks/usePagination';

const PAGE_SIZES = [10, 25, 50, 100];

export function Pagination() {
  const { currentPage, pageSize, filteredData, setCurrentPage, setPageSize } = useCSVStore();
  const { totalPages, startIndex, endIndex } = usePagination();

  if (filteredData.length === 0) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (currentPage <= 4) return i + 1;
    if (currentPage >= totalPages - 3) return totalPages - 6 + i;
    return currentPage - 3 + i;
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Linhas por página:</span>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-2">
          {startIndex + 1}–{endIndex} de {filteredData.length}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
        >
          «
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
        >
          ‹
        </button>

        {pages.map(p => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`px-3 py-1 text-sm rounded border ${
              p === currentPage
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
        >
          ›
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
        >
          »
        </button>
      </div>
    </div>
  );
}

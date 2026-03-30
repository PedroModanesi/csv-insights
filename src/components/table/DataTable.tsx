import { useEffect, useMemo } from 'react';
import { useCSVStore } from '../../store/csvStore';
import { useAIStore } from '../../store/aiStore';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from './Pagination';
import { ColumnFilter } from './ColumnFilter';
import { ColumnBadge } from '../stats/ColumnBadge';
import type { CSVRow } from '../../types/csv.types';

/** Highlights occurrences of `query` within `text`. */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/60 rounded-sm">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function DataTable() {
  const {
    rawData, headers, columnTypes, filteredData,
    sortConfig, searchQuery, columnFilter,
    setFilteredData, setSortConfig, setSearchQuery,
  } = useCSVStore();
  const { anomalyRowIndices } = useAIStore();
  const { pageData } = usePagination();

  // Build a Set of anomalous row objects for O(1) lookup during render
  const anomalyRowSet = useMemo(() => {
    if (!anomalyRowIndices.length) return new Set<CSVRow>();
    const s = new Set<CSVRow>();
    for (const idx of anomalyRowIndices) {
      if (rawData[idx]) s.add(rawData[idx]);
    }
    return s;
  }, [anomalyRowIndices, rawData]);

  // Apply search + column filter + sort
  useEffect(() => {
    let data = rawData;

    // Apply column filter
    if (columnFilter?.column && columnFilter.value) {
      data = data.filter(row => row[columnFilter.column] === columnFilter.value);
    }

    // Apply global search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(row =>
        headers.some(h => row[h]?.toLowerCase().includes(q))
      );
    }

    // Apply sort
    if (sortConfig) {
      const { column, direction } = sortConfig;
      const type = columnTypes[column];
      data = [...data].sort((a, b) => {
        const av = a[column] ?? '';
        const bv = b[column] ?? '';

        let cmp = 0;
        if (type === 'number') {
          cmp = parseFloat(av) - parseFloat(bv);
        } else if (type === 'date') {
          cmp = Date.parse(av) - Date.parse(bv);
        } else {
          cmp = av.localeCompare(bv);
        }

        return direction === 'asc' ? cmp : -cmp;
      });
    }

    setFilteredData(data);
  }, [rawData, headers, columnTypes, searchQuery, columnFilter, sortConfig, setFilteredData]);

  const handleSort = (column: string) => {
    setSortConfig(
      sortConfig?.column === column
        ? { column, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    );
  };

  const isNumericCol = useMemo(
    () => headers.reduce<Record<string, boolean>>((acc, h) => {
      acc[h] = columnTypes[h] === 'number';
      return acc;
    }, {}),
    [headers, columnTypes]
  );

  if (rawData.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar em todas as colunas..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <ColumnFilter />
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Nenhum resultado encontrado
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  {headers.map(h => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                      onClick={() => handleSort(h)}
                    >
                      <div className="flex items-center gap-1.5">
                        {columnTypes[h] && <ColumnBadge type={columnTypes[h]} />}
                        <span>{h}</span>
                        {sortConfig?.column === h && (
                          <span className="text-blue-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-100 dark:border-gray-700 transition-colors ${
                      anomalyRowSet.has(row)
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                    title={anomalyRowSet.has(row) ? '⚠ Linha com anomalia detectada' : undefined}
                  >
                    {headers.map(h => (
                      <td
                        key={h}
                        className={`px-3 py-2 text-gray-700 dark:text-gray-300 max-w-48 overflow-hidden text-ellipsis whitespace-nowrap ${
                          isNumericCol[h] ? 'text-right font-mono' : ''
                        }`}
                        title={row[h]}
                      >
                        <HighlightText text={row[h] ?? ''} query={searchQuery} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      )}
    </div>
  );
}

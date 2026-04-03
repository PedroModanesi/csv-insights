import { useCallback, useEffect, useMemo } from 'react';
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
    rawData, headers, columnTypes, filteredData, fileName,
    sortConfig, searchQuery, columnFilter,
    setFilteredData, setSortConfig, setSearchQuery,
  } = useCSVStore();
  const { anomalyRowIndices } = useAIStore();
  const { pageData } = usePagination();

  // Set of rawData indices flagged as anomalous — O(1) lookup
  const anomalyIndexSet = useMemo(() => new Set(anomalyRowIndices), [anomalyRowIndices]);

  // Map from row object reference → its rawData index, so we can look up
  // rows that come from filteredData/pageData (which share references with rawData)
  const rawDataIndexMap = useMemo(() => {
    const m = new Map<CSVRow, number>();
    rawData.forEach((row, i) => m.set(row, i));
    return m;
  }, [rawData]);

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

  const exportCSV = useCallback(() => {
    const escapeCell = (v: string) => {
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };
    const lines = [
      headers.map(escapeCell).join(','),
      ...filteredData.map(row => headers.map(h => escapeCell(row[h] ?? '')).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `${fileName.replace(/\.csv$/i, '')}_filtrado.csv` : 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [headers, filteredData, fileName]);

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
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {filteredData.length.toLocaleString('pt-BR')} / {rawData.length.toLocaleString('pt-BR')} linhas
        </span>
        <button
          onClick={exportCSV}
          className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          title="Exportar dados filtrados como CSV"
        >
          ↓ Exportar CSV
        </button>
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
                      anomalyIndexSet.has(rawDataIndexMap.get(row) ?? -1)
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                    title={anomalyIndexSet.has(rawDataIndexMap.get(row) ?? -1) ? '⚠ Linha com anomalia detectada' : undefined}
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

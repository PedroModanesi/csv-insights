import { useCSVStore } from '../../store/csvStore';

export function ColumnFilter() {
  const { headers, columnFilter, setColumnFilter, rawData } = useCSVStore();

  const uniqueValues = columnFilter?.column
    ? [...new Set(rawData.map(r => r[columnFilter.column]).filter(Boolean))].slice(0, 100).sort()
    : [];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={columnFilter?.column ?? ''}
        onChange={e => setColumnFilter(e.target.value ? { column: e.target.value, value: '' } : null)}
      >
        <option value="">Filtrar por coluna...</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>

      {columnFilter?.column && (
        <select
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={columnFilter.value}
          onChange={e => setColumnFilter({ column: columnFilter.column, value: e.target.value })}
        >
          <option value="">Todos os valores</option>
          {uniqueValues.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      )}

      {columnFilter && (
        <button
          onClick={() => setColumnFilter(null)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 px-2"
          aria-label="Limpar filtro"
        >
          ✕ Limpar
        </button>
      )}
    </div>
  );
}

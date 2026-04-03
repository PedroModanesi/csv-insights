import { useCSVStore } from '../../store/csvStore';
import type { ColumnStats } from '../../types/csv.types';
import { ColumnBadge } from './ColumnBadge';

function StatCard({ header, stats }: { header: string; stats: ColumnStats }) {
  const renderContent = () => {
    switch (stats.type) {
      case 'number':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            <span className="text-gray-500 dark:text-gray-400">Mín</span>
            <span className="font-mono">{stats.min.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
            <span className="text-gray-500 dark:text-gray-400">Máx</span>
            <span className="font-mono">{stats.max.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
            <span className="text-gray-500 dark:text-gray-400">Média</span>
            <span className="font-mono">{stats.mean.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
            <span className="text-gray-500 dark:text-gray-400">Mediana</span>
            <span className="font-mono">{stats.median.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
            <span className="text-gray-500 dark:text-gray-400">Q1</span>
            <span className="font-mono">{stats.q1.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
            <span className="text-gray-500 dark:text-gray-400">Q3</span>
            <span className="font-mono">{stats.q3.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
            <span className="text-gray-500 dark:text-gray-400">IQR</span>
            <span className="font-mono">{stats.iqr.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
          </div>
        );
      case 'category':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            <span className="text-gray-500 dark:text-gray-400">Únicos</span>
            <span className="font-mono">{stats.uniqueCount}</span>
            <span className="text-gray-500 dark:text-gray-400">Mais freq.</span>
            <span className="font-mono truncate" title={stats.topValue}>{stats.topValue}</span>
          </div>
        );
      case 'date':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            <span className="text-gray-500 dark:text-gray-400">Mais antiga</span>
            <span className="font-mono">{stats.oldest}</span>
            <span className="text-gray-500 dark:text-gray-400">Mais recente</span>
            <span className="font-mono">{stats.newest}</span>
            <span className="text-gray-500 dark:text-gray-400">Período</span>
            <span className="font-mono">{stats.spanDays} dias</span>
          </div>
        );
      case 'boolean':
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            <span className="text-gray-500 dark:text-gray-400">Verdadeiro</span>
            <span className="font-mono">{stats.trueCount}</span>
            <span className="text-gray-500 dark:text-gray-400">Falso</span>
            <span className="font-mono">{stats.falseCount}</span>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            <span className="text-gray-500 dark:text-gray-400">Únicos</span>
            <span className="font-mono">{stats.uniqueCount}</span>
            <span className="text-gray-500 dark:text-gray-400">Preenchidos</span>
            <span className="font-mono">{stats.count}</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <ColumnBadge type={stats.type} />
        <span className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate" title={header}>
          {header}
        </span>
      </div>
      {renderContent()}
      {stats.nullCount > 0 && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          ⚠ {stats.nullCount} vazio{stats.nullCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export function SummaryStats() {
  const { headers, columnStats } = useCSVStore();

  if (headers.length === 0) return null;

  return (
    <div>
      <div className="stats-section-title">
        Estatísticas por Coluna
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {headers.map(h => (
          columnStats[h] ? <StatCard key={h} header={h} stats={columnStats[h]} /> : null
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useCSVStore } from '../../store/csvStore';
import { useAIStore } from '../../store/aiStore';
import { useAiAnalysis } from '../../hooks/useAiAnalysis';
import { BarChartView } from './BarChart';
import { HistogramView } from './Histogram';
import { LineChartView } from './LineChart';
import { ScatterPlotView } from './ScatterPlot';
import type { ChartType } from '../../types/ai.types';

interface ActiveChart {
  type: ChartType;
  columns: string[];
  title: string;
}

export function ChartPanel() {
  const { headers, columnTypes, rawData } = useCSVStore();
  const { chartSuggestions, isLoadingSuggestions } = useAIStore();
  const { suggestCharts } = useAiAnalysis();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [scatterX, setScatterX] = useState('');
  const [scatterY, setScatterY] = useState('');
  const [lineX, setLineX] = useState('');
  const [lineY, setLineY] = useState('');
  const [activeChart, setActiveChart] = useState<ActiveChart | null>(null);

  if (rawData.length === 0) return null;

  const numericColumns = headers.filter(h => columnTypes[h] === 'number');
  const categoricalColumns = headers.filter(h => columnTypes[h] === 'category' || columnTypes[h] === 'boolean');
  const dateColumns = headers.filter(h => columnTypes[h] === 'date');

  const handleColumnSelect = (col: string) => {
    setSelectedColumn(col);
    const type = columnTypes[col];
    if (type === 'number') {
      setActiveChart({ type: 'histogram', columns: [col], title: `Distribuição de ${col}` });
    } else if (type === 'category' || type === 'boolean') {
      setActiveChart({ type: 'bar', columns: [col], title: `Frequência de ${col}` });
    }
  };

  const handleScatter = () => {
    if (scatterX && scatterY) {
      setActiveChart({ type: 'scatter', columns: [scatterX, scatterY], title: `${scatterX} × ${scatterY}` });
    }
  };

  const handleLine = () => {
    if (lineX && lineY) {
      setActiveChart({ type: 'line', columns: [lineX, lineY], title: `${lineY} ao longo de ${lineX}` });
    }
  };

  const renderChart = (chart: ActiveChart) => {
    if (chart.type === 'histogram') {
      return <HistogramView column={chart.columns[0]} title={chart.title} />;
    }
    if (chart.type === 'bar') {
      return <BarChartView column={chart.columns[0]} title={chart.title} />;
    }
    if (chart.type === 'scatter' && chart.columns.length >= 2) {
      return <ScatterPlotView xColumn={chart.columns[0]} yColumn={chart.columns[1]} title={chart.title} />;
    }
    if (chart.type === 'line' && chart.columns.length >= 2) {
      return <LineChartView xColumn={chart.columns[0]} yColumn={chart.columns[1]} title={chart.title} />;
    }
    return <div className="text-gray-500 dark:text-gray-400 text-center py-8">Tipo de gráfico não suportado</div>;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Gráficos</h2>

      {/* Single-column: bar / histogram */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedColumn}
          onChange={e => handleColumnSelect(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Coluna (barra / histograma)...</option>
          {numericColumns.length > 0 && (
            <optgroup label="Numéricas">
              {numericColumns.map(h => <option key={h} value={h}>{h}</option>)}
            </optgroup>
          )}
          {categoricalColumns.length > 0 && (
            <optgroup label="Categóricas">
              {categoricalColumns.map(h => <option key={h} value={h}>{h}</option>)}
            </optgroup>
          )}
        </select>

        <button
          onClick={suggestCharts}
          disabled={isLoadingSuggestions}
          className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoadingSuggestions ? (
            <><span className="animate-spin">⟳</span> Analisando...</>
          ) : (
            '✨ Sugerir gráficos'
          )}
        </button>
      </div>

      {/* Scatter plot: two numeric columns */}
      {numericColumns.length >= 2 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dispersão:</span>
          <select
            value={scatterX}
            onChange={e => setScatterX(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Eixo X...</option>
            {numericColumns.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="text-gray-400">×</span>
          <select
            value={scatterY}
            onChange={e => setScatterY(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Eixo Y...</option>
            {numericColumns.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button
            onClick={handleScatter}
            disabled={!scatterX || !scatterY || scatterX === scatterY}
            className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            Plotar
          </button>
        </div>
      )}

      {/* Line chart: date X + numeric Y */}
      {dateColumns.length >= 1 && numericColumns.length >= 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Linha temporal:</span>
          <select
            value={lineX}
            onChange={e => setLineX(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Data (X)...</option>
            {dateColumns.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select
            value={lineY}
            onChange={e => setLineY(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Valor (Y)...</option>
            {numericColumns.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button
            onClick={handleLine}
            disabled={!lineX || !lineY}
            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            Plotar
          </button>
        </div>
      )}

      {/* AI Chart Suggestions */}
      {chartSuggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sugestões da IA</h3>
          <div className="flex flex-wrap gap-2">
            {chartSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveChart({ type: s.type, columns: s.columns, title: s.title })}
                title={s.reasoning}
                className="px-3 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
              >
                {s.type === 'bar' ? '📊' : s.type === 'histogram' ? '📉' : s.type === 'scatter' ? '⚡' : '📈'} {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Chart */}
      {activeChart ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          {renderChart(activeChart)}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400 dark:text-gray-500">
          Selecione uma coluna para visualizar o gráfico
        </div>
      )}
    </div>
  );
}

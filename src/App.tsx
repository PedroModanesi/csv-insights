import { useState } from 'react';
import { DropZone } from './components/upload/DropZone';
import { SummaryStats } from './components/stats/SummaryStats';
import { DataTable } from './components/table/DataTable';
import { ChartPanel } from './components/charts/ChartPanel';
import { AiInsights } from './components/ai/AiInsights';
import { AiChat } from './components/ai/AiChat';
import { AiReport } from './components/ai/AiReport';
import { AiAnomalies } from './components/ai/AiAnomalies';
import { AiCodeGen } from './components/ai/AiCodeGen';
import { useCSVStore } from './store/csvStore';
import { useAIStore } from './store/aiStore';
import { useColumnTypes } from './hooks/useColumnTypes';

const TABS = [
  { id: 'insights', label: '✨ Insights' },
  { id: 'table', label: '📋 Tabela' },
  { id: 'charts', label: '📊 Gráficos' },
  { id: 'chat', label: '💬 Chat IA' },
  { id: 'advanced', label: '🤖 IA Avançada' },
] as const;

type TabId = typeof TABS[number]['id'];

function FileInfoBar() {
  const { fileName, totalRows, headers, reset } = useCSVStore();
  const { resetAI } = useAIStore();

  if (!fileName) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-2xl">📄</span>
        <div>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{fileName}</span>
          <span className="ml-3 text-gray-500 dark:text-gray-400">
            {totalRows.toLocaleString('pt-BR')} linhas · {headers.length} colunas
          </span>
        </div>
      </div>
      <button
        onClick={() => { reset(); resetAI(); }}
        className="text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
      >
        ✕ Remover
      </button>
    </div>
  );
}

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'insights':
      return (
        <div className="space-y-6">
          <AiInsights />
          <SummaryStats />
        </div>
      );
    case 'table':
      return <DataTable />;
    case 'charts':
      return <ChartPanel />;
    case 'chat':
      return <AiChat />;
    case 'advanced':
      return (
        <div className="space-y-6">
          <AiReport />
          <AiAnomalies />
          <AiCodeGen />
        </div>
      );
  }
}

export default function App() {
  useColumnTypes();

  const { rawData } = useCSVStore();
  const [activeTab, setActiveTab] = useState<TabId>('insights');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            CSV Insights
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
            Visualizador de dados CSV com análise por IA
          </p>
        </div>

        {/* Upload or file info */}
        {rawData.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <DropZone />
          </div>
        ) : (
          <FileInfoBar />
        )}

        {/* Tab navigation + content */}
        {rawData.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === t.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <TabContent tab={activeTab} />
          </div>
        )}
      </div>
    </div>
  );
}

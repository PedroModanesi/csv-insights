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
  { id: 'insights',  label: 'Insights'  },
  { id: 'table',     label: 'Tabela'    },
  { id: 'charts',    label: 'Gráficos'  },
  { id: 'chat',      label: 'Chat IA'   },
  { id: 'advanced',  label: 'IA Avç'    },
] as const;

type TabId = typeof TABS[number]['id'];

function FileInfoBar() {
  const { fileName, totalRows, headers, reset } = useCSVStore();
  const { resetAI } = useAIStore();

  if (!fileName) return null;

  return (
    <div className="file-info-bar phosphor-in">
      <div className="file-info-left">
        <span className="file-info-prompt">▸</span>
        <span className="file-info-name">{fileName}</span>
        <span className="file-info-sep">///</span>
        <span className="file-info-meta">{totalRows.toLocaleString('pt-BR')} linhas</span>
        <span className="file-info-sep">·</span>
        <span className="file-info-meta">{headers.length} colunas</span>
      </div>
      <button
        onClick={() => { reset(); resetAI(); }}
        className="file-info-remove"
      >
        × REMOVER
      </button>
    </div>
  );
}

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'insights':
      return (
        <div className="space-y-6 phosphor-in">
          <AiInsights />
          <SummaryStats />
        </div>
      );
    case 'table':
      return <div className="phosphor-in"><DataTable /></div>;
    case 'charts':
      return <div className="phosphor-in"><ChartPanel /></div>;
    case 'chat':
      return <div className="phosphor-in"><AiChat /></div>;
    case 'advanced':
      return (
        <div className="space-y-6 phosphor-in">
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
    <div style={{ minHeight: '100vh', background: 'var(--void)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 64px' }}>

        {/* ── Terminal Header ── */}
        <header className="terminal-header phosphor-in">
          <div className="terminal-header-left">
            <div className="terminal-dots">
              <span className="tdot tdot-red" />
              <span className="tdot tdot-amber" />
              <span className="tdot tdot-green" />
            </div>
            <div>
              <h1 className="terminal-logo">
                CSV<span>·</span>INSIGHTS
              </h1>
              <p className="terminal-subtitle">
                <span className="prompt">▸ </span>
                Visualizador de dados CSV com inteligência artificial
              </p>
            </div>
          </div>
          <div className="terminal-header-right">
            <div className="sys-status">
              <span className="sys-status-dot" />
              SYS:ONLINE
            </div>
          </div>
        </header>

        {/* ── Upload or File Info ── */}
        {rawData.length === 0 ? (
          <div style={{ maxWidth: '640px', margin: '0 auto' }} className="phosphor-in-d1">
            <DropZone />
          </div>
        ) : (
          <>
            <FileInfoBar />

            {/* ── Tab Navigation ── */}
            <nav className="tab-bar phosphor-in-d1">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`tab-btn ${activeTab === t.id ? 'tab-btn-active' : ''}`}
                >
                  <span className="tab-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="tab-label">{t.label}</span>
                </button>
              ))}
            </nav>

            <TabContent tab={activeTab} />
          </>
        )}

      </div>
    </div>
  );
}

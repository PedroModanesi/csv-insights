import { useAIStore } from '../../store/aiStore';
import { useCSVStore } from '../../store/csvStore';
import { useAiAnalysis } from '../../hooks/useAiAnalysis';

export function AiInsights() {
  const { isAnalyzing, autoAnalysis, analysisError } = useAIStore();
  const { rawData } = useCSVStore();
  const { analyzeDataset } = useAiAnalysis();

  if (rawData.length === 0) return null;

  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return (
      <div className="insights-no-key">
        <strong style={{ color: 'var(--amber)' }}>IA não configurada.</strong>{' '}
        Adicione <code>VITE_GEMINI_API_KEY</code> no arquivo <code>.env</code> para habilitar os insights automáticos.
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="insights-loading">
        <div className="insights-spinner" />
        <span>Analisando dataset com IA...</span>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="insights-error">
        <span className="insights-error-text">⚠ {analysisError}</span>
        <button onClick={analyzeDataset} className="insights-retry">
          TENTAR NOVAMENTE
        </button>
      </div>
    );
  }

  if (!autoAnalysis) {
    return (
      <div className="insights-idle">
        <span className="insights-idle-text">▸ Análise automática disponível</span>
        <button onClick={analyzeDataset} className="insights-analyze-btn">
          ANALISAR COM IA
        </button>
      </div>
    );
  }

  return (
    <div className="insights-card phosphor-in">
      <div className="insights-header">
        <div className="insights-title">
          <span className="insights-title-dot" />
          Insights da IA
        </div>
        <button onClick={analyzeDataset} className="insights-reanalyze">
          REANALISAR
        </button>
      </div>

      {/* Description */}
      <p className="insights-description">{autoAnalysis.description}</p>

      {/* Insights */}
      {autoAnalysis.insights.length > 0 && (
        <div className="insights-section">
          <div className="insights-section-title insights-section-title--amber">
            Principais Insights
          </div>
          <ul className="insights-list">
            {autoAnalysis.insights.map((insight, i) => (
              <li key={i} className="insights-list-item">
                <span className="bullet">→</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quality issues */}
      {autoAnalysis.qualityIssues.length > 0 && (
        <div className="insights-section">
          <div className="insights-section-title insights-section-title--red">
            ⚠ Qualidade dos Dados
          </div>
          <ul className="insights-list">
            {autoAnalysis.qualityIssues.map((issue, i) => (
              <li key={i} className="insights-list-item">
                <span className="bullet">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {autoAnalysis.suggestions.length > 0 && (
        <div className="insights-section">
          <div className="insights-section-title insights-section-title--green">
            Sugestões de Análise
          </div>
          <ul className="insights-list">
            {autoAnalysis.suggestions.map((s, i) => (
              <li key={i} className="insights-list-item">
                <span className="bullet bullet-num">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

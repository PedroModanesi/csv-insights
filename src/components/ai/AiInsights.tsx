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
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
        <strong>IA não configurada.</strong> Adicione <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_GEMINI_API_KEY</code> no arquivo <code>.env</code> para habilitar os insights automáticos.
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Analisando dataset com IA...</span>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{analysisError}</p>
          <button
            onClick={analyzeDataset}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400 ml-4"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!autoAnalysis) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Análise automática disponível</span>
        <button
          onClick={analyzeDataset}
          className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Analisar com IA
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>✨</span> Insights da IA
        </h2>
        <button
          onClick={analyzeDataset}
          className="text-xs text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
        >
          Reanalisar
        </button>
      </div>

      {/* Dataset description */}
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {autoAnalysis.description}
        </p>
      </div>

      {/* Insights */}
      {autoAnalysis.insights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Principais Insights</h3>
          <ul className="space-y-1.5">
            {autoAnalysis.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-blue-500 mt-0.5">→</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quality issues */}
      {autoAnalysis.qualityIssues.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">⚠ Qualidade dos Dados</h3>
          <ul className="space-y-1.5">
            {autoAnalysis.qualityIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {autoAnalysis.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">💡 Sugestões de Análise</h3>
          <ul className="space-y-1.5">
            {autoAnalysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-0.5">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useCallback } from 'react';
import { useAIStore } from '../../store/aiStore';
import { useCSVStore } from '../../store/csvStore';
import { useGeminiAdvanced } from '../../hooks/useGeminiAdvanced';

const SAMPLE_LIMIT = 300;

export function AiAnomalies() {
  const { rawData, headers, fileName } = useCSVStore();
  const {
    isDetectingAnomalies, anomalyRowIndices, anomalyDetails,
    anomalySummary, anomalyError, clearAnomalies,
    isFixingAnomalies, fixedRows, fixError, clearFix,
  } = useAIStore();
  const { detectAnomalies, fixAnomalies } = useGeminiAdvanced();

  const handleFix = () => {
    if (anomalyDetails.length > 0) {
      fixAnomalies(anomalyDetails);
    }
  };

  const handleDownload = useCallback(() => {
    if (!fixedRows) return;

    const escapeCell = (v: string) => {
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };

    const lines = [
      headers.map(escapeCell).join(','),
      ...fixedRows.map(row =>
        headers.map(h => {
          const val = row[h];
          // Ensure every cell is a plain string, even if AI returned an object
          const str = val === null || val === undefined
            ? ''
            : typeof val === 'object'
              ? JSON.stringify(val)
              : String(val);
          return escapeCell(str);
        }).join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `${fileName.replace(/\.(csv|xlsx|xls)$/i, '')}_corrigido.csv` : 'dados_corrigidos.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [fixedRows, headers, fileName]);

  if (rawData.length === 0) return null;

  const hasResults = anomalyRowIndices.length > 0 || anomalySummary;
  const sampleNote = rawData.length > SAMPLE_LIMIT
    ? ` (análise nas primeiras ${SAMPLE_LIMIT} linhas)`
    : '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>🔍</span> Detecção de Anomalias
        </h2>
        <div className="flex items-center gap-2">
          {hasResults && (
            <button
              onClick={clearAnomalies}
              className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            >
              Limpar
            </button>
          )}
          <button
            onClick={detectAnomalies}
            disabled={isDetectingAnomalies}
            className="px-4 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {isDetectingAnomalies ? 'Analisando...' : 'Detectar Anomalias'}
          </button>
        </div>
      </div>

      {!hasResults && !isDetectingAnomalies && !anomalyError && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Detecta outliers numéricos, valores suspeitos e linhas duplicadas{sampleNote}.
          As linhas problemáticas ficam destacadas na aba Tabela.
        </p>
      )}

      {isDetectingAnomalies && (
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Analisando {Math.min(rawData.length, SAMPLE_LIMIT)} linhas{sampleNote}...</span>
        </div>
      )}

      {anomalyError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          {anomalyError}
        </div>
      )}

      {hasResults && !isDetectingAnomalies && (
        <div className="space-y-4">
          {/* Summary */}
          {anomalySummary && (
            <div className={`rounded-lg p-3 text-sm border ${
              anomalyRowIndices.length === 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}>
              {anomalyRowIndices.length > 0 && (
                <strong className="block mb-1">
                  ⚠ {anomalyRowIndices.length} linha{anomalyRowIndices.length !== 1 ? 's' : ''} problemática{anomalyRowIndices.length !== 1 ? 's' : ''} encontrada{anomalyRowIndices.length !== 1 ? 's' : ''}
                  {sampleNote}
                </strong>
              )}
              {anomalySummary}
            </div>
          )}

          {/* Highlight indicator */}
          {anomalyRowIndices.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-block w-3 h-3 rounded bg-amber-200 dark:bg-amber-700/60 border border-amber-400 flex-shrink-0" />
              As linhas destacadas em laranja estão visíveis na aba <strong>Tabela</strong>.
            </div>
          )}

          {/* Detail list */}
          {anomalyDetails.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Detalhes das anomalias
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {anomalyDetails.map((detail, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2"
                  >
                    <span className="font-mono text-amber-700 dark:text-amber-300 whitespace-nowrap">
                      Linha {detail.rowIndex + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{detail.column}: </span>
                      <code className="text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-1 rounded">
                        {detail.value}
                      </code>
                      <span className="block text-gray-600 dark:text-gray-400 mt-0.5">{detail.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI Fix section ───────────────────────────────────────────── */}
          {anomalyDetails.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    ✨ Corrigir automaticamente com IA
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    A IA corrige os valores problemáticos e gera um arquivo CSV limpo para download.
                  </p>
                </div>
                <button
                  onClick={handleFix}
                  disabled={isFixingAnomalies || !!fixedRows}
                  className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  {isFixingAnomalies ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Corrigindo...
                    </span>
                  ) : fixedRows ? '✓ Corrigido' : '🛠 Corrigir e Baixar'}
                </button>
              </div>

              {fixError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  {fixError}
                </div>
              )}

              {fixedRows && (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <strong>✓ Arquivo corrigido pronto</strong>
                    <span className="text-xs ml-2 text-green-600 dark:text-green-400">
                      {fixedRows.length} linhas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearFix}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      ↓ Baixar CSV Corrigido
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

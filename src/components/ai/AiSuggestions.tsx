import { useAIStore } from '../../store/aiStore';

// This component is re-exported from ChartPanel's suggestion section,
// but can also be used standalone to display current suggestions.
export function AiSuggestions() {
  const { chartSuggestions } = useAIStore();

  if (chartSuggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
        ✨ Sugestões de Visualização
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {chartSuggestions.map((s, i) => (
          <div
            key={i}
            className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg text-sm"
          >
            <div className="font-medium text-purple-800 dark:text-purple-200 mb-1">{s.title}</div>
            <div className="text-xs text-purple-600 dark:text-purple-400">{s.reasoning}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Colunas: {s.columns.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

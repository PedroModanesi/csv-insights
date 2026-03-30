import { useCallback, useState, useRef } from 'react';
import { useCSVParser } from '../../hooks/useCSVParser';
import { useCSVStore } from '../../store/csvStore';
import { useAIStore } from '../../store/aiStore';
import { useAiAnalysis } from '../../hooks/useAiAnalysis';

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setData, reset } = useCSVStore();
  const { resetAI } = useAIStore();
  const { analyzeDataset } = useAiAnalysis();

  const { parse, isLoading, progress, error } = useCSVParser(({ data, headers, error: parseError }) => {
    if (!parseError && data.length > 0) {
      setData(data, headers, '');
      // Trigger AI analysis after a short delay to let state settle
      setTimeout(() => analyzeDataset(), 300);
    }
  });

  const handleFile = useCallback((file: File) => {
    reset();
    resetAI();
    // Store filename via the store after parse
    parse(file);
    // Update filename directly
    useCSVStore.setState({ fileName: file.name });
  }, [parse, reset, resetAI]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}
          ${isLoading ? 'pointer-events-none opacity-70' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Área para upload de arquivo CSV"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileChange}
        />

        {isLoading ? (
          <div className="space-y-4">
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Processando arquivo...
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{progress}%</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-5xl">📄</div>
            <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              Arraste um arquivo CSV aqui
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              ou clique para selecionar
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              Suporta vírgula, ponto-e-vírgula e tab · Máx. 50MB
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

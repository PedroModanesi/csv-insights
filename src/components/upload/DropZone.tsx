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
      setTimeout(() => analyzeDataset(), 300);
    }
  });

  const handleFile = useCallback((file: File) => {
    reset();
    resetAI();
    parse(file);
    useCSVStore.setState({ fileName: file.name });
  }, [parse, reset, resetAI]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.match(/\.(csv|xlsx|xls)$/i)) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="dropzone-wrap">
      <div
        className={[
          'dropzone',
          isDragging  ? 'dropzone--active'  : '',
          isLoading   ? 'dropzone--loading' : '',
        ].join(' ')}
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
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />

        {isLoading ? (
          <div className="dropzone-loading">
            <div className="dropzone-loading-title">
              <span className="prompt">$ </span>
              PROCESSANDO ARQUIVO...
            </div>
            <div className="terminal-progress">
              <div
                className="terminal-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="dropzone-loading-pct">{progress}%</div>
          </div>
        ) : (
          <div className="dropzone-idle">
            <div className="dropzone-badge">
              <span className="dropzone-badge-dot" />
              SISTEMA PRONTO
            </div>

            <div className="dropzone-title">INICIALIZAR ANÁLISE</div>

            <div className="dropzone-hints">
              <div className="dropzone-hint">
                <span className="arrow">▸ </span>
                Arraste um arquivo .CSV aqui
              </div>
              <div className="dropzone-hint">
                <span className="arrow">▸ </span>
                ou pressione o botão abaixo
              </div>
            </div>

            <button
              className="dropzone-cta"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              [ SELECIONAR ARQUIVO ]
            </button>

            <div className="dropzone-meta">
              CSV &nbsp;·&nbsp; XLSX &nbsp;·&nbsp; XLS &nbsp;·&nbsp; máx. <span>50MB</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="dropzone-error">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}

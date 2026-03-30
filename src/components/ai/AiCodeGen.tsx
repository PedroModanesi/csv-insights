import { useState, useEffect, useRef, Component } from 'react';
import hljs from 'highlight.js';
import { useAIStore } from '../../store/aiStore';
import { useCSVStore } from '../../store/csvStore';
import { useGeminiAdvanced } from '../../hooks/useGeminiAdvanced';
import type { CodeLanguage } from '../../utils/codeFormatter';

// ── Error Boundary ────────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }
class CodeErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { hasError: true, message: msg };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400">
          Erro ao renderizar o código: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Code block with syntax highlighting ──────────────────────────────────────
function CodeBlock({ code, language }: { code: string; language: CodeLanguage }) {
  const [copied, setCopied] = useState(false);

  let highlighted = code;
  try {
    highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value;
  } catch {
    // Fallback: display raw code without highlighting
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 px-4 py-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {language === 'python' ? '🐍 Python (pandas)' : '🗄️ SQL'}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? '✓ Copiado!' : '⎘ Copiar'}
        </button>
      </div>
      {/* Code */}
      <pre className="bg-gray-900 overflow-x-auto p-4 text-sm leading-relaxed m-0">
        <code
          className={`language-${language} text-gray-100`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AiCodeGen() {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<CodeLanguage>('python');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { rawData } = useCSVStore();
  const { isGeneratingCode, generatedCode, generatedCodeLang, codeError } = useAIStore();
  const { generateCode } = useGeminiAdvanced();

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [description]);

  const handleGenerate = () => {
    if (!description.trim() || isGeneratingCode) return;
    generateCode(description.trim(), language);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (rawData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span>⚡</span> Gerar Código
      </h2>

      {/* Language selector */}
      <div className="flex gap-2">
        {(['python', 'sql'] as CodeLanguage[]).map(lang => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              language === lang
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            {lang === 'python' ? '🐍 Python' : '🗄️ SQL'}
          </button>
        ))}
      </div>

      {/* Description input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Descreva a análise que deseja fazer{' '}
          <span className="font-normal text-gray-400">(Ctrl+Enter para gerar)</span>
        </label>
        <textarea
          ref={textareaRef}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            language === 'python'
              ? 'Ex: calcular a média por categoria e mostrar as 10 maiores, filtrar linhas nulas, agrupar por mês...'
              : 'Ex: total de vendas por região, clientes com mais de 5 pedidos, média mensal de faturamento...'
          }
          rows={3}
          disabled={isGeneratingCode}
          className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!description.trim() || isGeneratingCode}
        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        {isGeneratingCode ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            Gerando...
          </>
        ) : '⚡ Gerar Código'}
      </button>

      {codeError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          {codeError}
        </div>
      )}

      {generatedCode && !isGeneratingCode && (
        <CodeErrorBoundary>
          <CodeBlock code={generatedCode} language={generatedCodeLang} />
        </CodeErrorBoundary>
      )}
    </div>
  );
}

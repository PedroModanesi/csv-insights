import { useAIStore } from '../../store/aiStore';
import { useCSVStore } from '../../store/csvStore';
import { useGeminiAdvanced } from '../../hooks/useGeminiAdvanced';

function downloadMarkdown(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/\.csv$/i, '') + '_relatorio.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Renders markdown text as formatted HTML (headings, bold, lists, code blocks). */
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto text-xs font-mono my-2">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-3 mb-1">{line.slice(5)}</h4>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold text-gray-800 dark:text-gray-100 mt-4 mb-1.5">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-bold text-gray-900 dark:text-white mt-5 mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // List item
      const text = line.slice(2);
      elements.push(
        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-disc">
          <InlineMarkdown text={text} />
        </li>
      );
    } else if (/^\d+\. /.test(line)) {
      const text = line.replace(/^\d+\. /, '');
      elements.push(
        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-decimal">
          <InlineMarkdown text={text} />
        </li>
      );
    } else if (line.trim() === '' || line === '---') {
      elements.push(<div key={i} className="my-1" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <InlineMarkdown text={line} />
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  // Bold **text** and inline code `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function AiReport() {
  const { rawData, fileName } = useCSVStore();
  const {
    isGeneratingReport, reportMarkdown, reportError,
    clearReport,
  } = useAIStore();
  const { generateReport } = useGeminiAdvanced();

  if (rawData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>📄</span> Relatório Completo
        </h2>
        <div className="flex items-center gap-2">
          {reportMarkdown && !isGeneratingReport && (
            <>
              <button
                onClick={() => downloadMarkdown(reportMarkdown, fileName)}
                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>⬇</span> Baixar .md
              </button>
              <button
                onClick={clearReport}
                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              >
                Limpar
              </button>
            </>
          )}
          <button
            onClick={generateReport}
            disabled={isGeneratingReport}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {isGeneratingReport ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {reportError && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          {reportError}
        </div>
      )}

      {!reportMarkdown && !isGeneratingReport && !reportError && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gere um relatório completo em Markdown com sumário executivo, análise por coluna, insights, qualidade dos dados e recomendações.
        </p>
      )}

      {(reportMarkdown || isGeneratingReport) && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-[600px] overflow-y-auto">
          <SimpleMarkdown content={reportMarkdown} />
          {isGeneratingReport && (
            <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      )}
    </div>
  );
}

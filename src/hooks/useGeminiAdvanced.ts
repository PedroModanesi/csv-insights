import { useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCSVStore } from '../store/csvStore';
import { useAIStore } from '../store/aiStore';
import { buildReportPrompt } from '../utils/reportBuilder';
import { buildAnomalyPrompt } from '../utils/anomalyDetector';
import { buildCodeGenPrompt, extractCodeFromResponse } from '../utils/codeFormatter';
import type { AnomalyResult, AnomalyDetail } from '../utils/anomalyDetector';
import type { CodeLanguage } from '../utils/codeFormatter';

const MODEL = 'gemini-2.5-flash';
const ANOMALY_SAMPLE_LIMIT = 300;

function getModel() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: MODEL });
}

export function useGeminiAdvanced() {
  const { rawData, headers, columnTypes, columnStats, fileName, totalRows } = useCSVStore();
  const {
    setIsGeneratingReport, appendReportMarkdown, setReportMarkdown, setReportError,
    setIsDetectingAnomalies, setAnomalyResult, setAnomalyError,
    setIsGeneratingCode, setGeneratedCode, setCodeError,
    setIsFixingAnomalies, setFixedRows, setFixError,
  } = useAIStore();

  /**
   * Generates a full markdown report using Gemini streaming.
   * Chunks are appended in real-time via appendReportMarkdown.
   */
  const generateReport = useCallback(async () => {
    const model = getModel();
    if (!model) {
      setReportError('Chave da API não configurada. Adicione VITE_GEMINI_API_KEY no arquivo .env');
      return;
    }
    if (rawData.length === 0) return;

    setIsGeneratingReport(true);
    setReportMarkdown('');
    setReportError(null);

    try {
      const prompt = buildReportPrompt(
        { headers, columnTypes },
        columnStats,
        rawData,
        fileName,
        totalRows
      );

      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) appendReportMarkdown(text);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setReportError(`Falha ao gerar relatório: ${msg}`);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [rawData, headers, columnTypes, columnStats, fileName, totalRows,
    setIsGeneratingReport, setReportMarkdown, appendReportMarkdown, setReportError]);

  /**
   * Detects anomalies in the dataset using Gemini.
   * Analyzes up to ANOMALY_SAMPLE_LIMIT rows.
   */
  const detectAnomalies = useCallback(async () => {
    const model = getModel();
    if (!model) {
      setAnomalyError('Chave da API não configurada.');
      return;
    }
    if (rawData.length === 0) return;

    setIsDetectingAnomalies(true);
    setAnomalyError(null);

    try {
      const prompt = buildAnomalyPrompt(
        { headers, columnTypes },
        columnStats,
        rawData,
        ANOMALY_SAMPLE_LIMIT
      );

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Resposta inválida da IA');

      const parsed: AnomalyResult = JSON.parse(jsonMatch[0]);

      // Merge anomaly indices from details + direct list, deduplicate
      const allIndices = new Set<number>([
        ...( parsed.anomalyRowIndices ?? []),
        ...(parsed.details ?? []).map(d => d.rowIndex),
        ...(parsed.duplicateGroups ?? []).flat(),
      ]);

      setAnomalyResult(
        [...allIndices].filter(i => i >= 0 && i < rawData.length),
        parsed.details ?? [],
        parsed.summary ?? ''
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setAnomalyError(`Falha na detecção de anomalias: ${msg}`);
    } finally {
      setIsDetectingAnomalies(false);
    }
  }, [rawData, headers, columnTypes, columnStats,
    setIsDetectingAnomalies, setAnomalyResult, setAnomalyError]);

  /**
   * Generates Python or SQL code from a natural language description.
   */
  const generateCode = useCallback(async (description: string, language: CodeLanguage) => {
    const model = getModel();
    if (!model) {
      setCodeError('Chave da API não configurada.');
      return;
    }
    if (!description.trim()) return;

    setIsGeneratingCode(true);
    setCodeError(null);

    try {
      const prompt = buildCodeGenPrompt(
        { headers, columnTypes },
        columnStats,
        description,
        language
      );

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const code = extractCodeFromResponse(text, language);
      setGeneratedCode(code, language);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setCodeError(`Falha ao gerar código: ${msg}`);
    } finally {
      setIsGeneratingCode(false);
    }
  }, [headers, columnTypes, columnStats, setIsGeneratingCode, setGeneratedCode, setCodeError]);

  /**
   * Asks the AI to correct each anomalous row and returns the full fixed dataset.
   */
  const fixAnomalies = useCallback(async (anomalyDetails: AnomalyDetail[]) => {
    const model = getModel();
    if (!model) {
      setFixError('Chave da API não configurada.');
      return;
    }
    if (rawData.length === 0 || anomalyDetails.length === 0) return;

    setIsFixingAnomalies(true);
    setFixError(null);
    setFixedRows(null);

    try {
      // Build a focused prompt with the anomalous rows + their problems
      const anomalyContext = anomalyDetails.map(d =>
        `Linha ${d.rowIndex + 1}, coluna "${d.column}": valor atual = "${d.value}" — problema: ${d.reason}`
      ).join('\n');

      const sampleAnomRows = anomalyDetails.slice(0, 50).map(d => ({
        rowIndex: d.rowIndex,
        row: rawData[d.rowIndex],
      }));

      const prompt = `Você é um especialista em limpeza de dados. Corrija as anomalias abaixo e retorne APENAS um JSON válido.

COLUNAS DO DATASET:
${headers.join(', ')}

ANOMALIAS ENCONTRADAS:
${anomalyContext}

LINHAS COM ANOMALIAS (dados atuais):
${JSON.stringify(sampleAnomRows, null, 2)}

INSTRUÇÕES CRÍTICAS:
- Cada entrada em "fixes" corrige UMA única célula: uma linha + uma coluna + um valor.
- "newValue" deve ser SEMPRE uma string simples (texto ou número). NUNCA um objeto, array ou JSON.
- Se a mesma linha tiver 3 colunas problemáticas, crie 3 entradas separadas, uma por coluna.
- Valores nulos/vazios: substitua pela mediana/moda da coluna quando possível, senão use "N/A".
- Outliers extremos: substitua pelo valor mais razoável baseado no contexto.
- Duplicatas: use { "rowIndex": N, "__remove__": true } para marcar remoção.
- NÃO inclua entradas para colunas sem problemas.

FORMATO DE SAÍDA (JSON puro, sem markdown, sem texto fora do JSON):
{
  "fixes": [
    { "rowIndex": 0, "column": "nome_da_coluna", "newValue": "valor_corrigido" },
    { "rowIndex": 2, "column": "outra_coluna", "newValue": "42" },
    { "rowIndex": 5, "__remove__": true }
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Resposta inválida da IA');

      const parsed: { fixes: Array<{ rowIndex: number; column?: string; newValue?: string; __remove__?: boolean }> } = JSON.parse(jsonMatch[0]);

      // Apply fixes to a copy of rawData
      const removeSet = new Set<number>();
      const patchMap = new Map<number, Record<string, string>>();

      for (const fix of parsed.fixes ?? []) {
        if (fix.__remove__) {
          removeSet.add(fix.rowIndex);
        } else if (fix.column && fix.newValue !== undefined) {
          const existing = patchMap.get(fix.rowIndex) ?? {};
          // Always coerce to plain string — guards against AI returning objects/numbers
          existing[fix.column] = typeof fix.newValue === 'string'
            ? fix.newValue
            : String(fix.newValue);
          patchMap.set(fix.rowIndex, existing);
        }
      }

      const fixedData = rawData
        .map((row, i) => {
          if (removeSet.has(i)) return null;
          const patches = patchMap.get(i);
          return patches ? { ...row, ...patches } : row;
        })
        .filter((row): row is Record<string, string> => row !== null);

      setFixedRows(fixedData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setFixError(`Falha ao corrigir anomalias: ${msg}`);
    } finally {
      setIsFixingAnomalies(false);
    }
  }, [rawData, headers, setIsFixingAnomalies, setFixedRows, setFixError]);

  return { generateReport, detectAnomalies, generateCode, fixAnomalies };
}

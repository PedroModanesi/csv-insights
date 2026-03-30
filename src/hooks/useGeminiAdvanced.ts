import { useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCSVStore } from '../store/csvStore';
import { useAIStore } from '../store/aiStore';
import { buildReportPrompt } from '../utils/reportBuilder';
import { buildAnomalyPrompt } from '../utils/anomalyDetector';
import { buildCodeGenPrompt, extractCodeFromResponse } from '../utils/codeFormatter';
import type { AnomalyResult } from '../utils/anomalyDetector';
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

  return { generateReport, detectAnomalies, generateCode };
}

import { useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useCSVStore } from '../store/csvStore';
import { useAIStore } from '../store/aiStore';
import {
  buildDatasetAnalysisPrompt,
  buildChatSystemPrompt,
  buildChartSuggestionsPrompt,
} from '../utils/aiPromptBuilder';
import type { DatasetAnalysis, ChartSuggestionsResponse, ChatMessage } from '../types/ai.types';

const MODEL = 'gemini-2.5-flash';

function getModel() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: MODEL });
}

export function useAiAnalysis() {
  const { rawData, headers, columnTypes, columnStats } = useCSVStore();
  const {
    setIsAnalyzing, setAutoAnalysis, setAnalysisError,
    chatHistory, addChatMessage, setIsLoadingChat, setChatError,
    setStreamingChatContent, appendStreamingChatContent,
    setChartSuggestions, setIsLoadingSuggestions,
  } = useAIStore();

  /**
   * Mode A: Automatic dataset analysis triggered when CSV is loaded.
   */
  const analyzeDataset = useCallback(async () => {
    const model = getModel();
    if (!model) {
      setAnalysisError('Chave da API não configurada. Adicione VITE_GEMINI_API_KEY no arquivo .env');
      return;
    }

    if (rawData.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const prompt = buildDatasetAnalysisPrompt(
        { headers, columnTypes },
        columnStats,
        rawData
      );

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Resposta inválida da IA');

      const analysis: DatasetAnalysis = JSON.parse(jsonMatch[0]);
      setAutoAnalysis(analysis);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setAnalysisError(`Falha na análise: ${msg}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [rawData, headers, columnTypes, columnStats, setIsAnalyzing, setAutoAnalysis, setAnalysisError]);

  /**
   * Mode B: Streaming chat with the dataset context.
   * Uses generateContentStream for typewriter effect in the UI.
   */
  const sendChatMessage = useCallback(async (userText: string) => {
    const model = getModel();
    if (!model) {
      setChatError('Chave da API não configurada');
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: userText, timestamp: Date.now() };
    addChatMessage(userMessage);
    setIsLoadingChat(true);
    setChatError(null);
    setStreamingChatContent('');

    try {
      const systemPrompt = buildChatSystemPrompt(
        { headers, columnTypes },
        columnStats,
        rawData
      );

      // Build history for multi-turn context (all previous turns)
      const history = chatHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
        history,
      });

      // Stream the response chunk by chunk
      const result = await chat.sendMessageStream(userText);
      let fullContent = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullContent += text;
          appendStreamingChatContent(text);
        }
      }

      // Commit the complete message to history
      setStreamingChatContent('');
      addChatMessage({ role: 'assistant', content: fullContent, timestamp: Date.now() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setChatError(`Falha no chat: ${msg}`);
      setStreamingChatContent('');
    } finally {
      setIsLoadingChat(false);
    }
  }, [rawData, headers, columnTypes, columnStats, chatHistory,
    addChatMessage, setIsLoadingChat, setChatError,
    setStreamingChatContent, appendStreamingChatContent]);

  /**
   * Mode C: AI-powered chart suggestions.
   */
  const suggestCharts = useCallback(async () => {
    const model = getModel();
    if (!model) return;

    setIsLoadingSuggestions(true);

    try {
      const prompt = buildChartSuggestionsPrompt(
        { headers, columnTypes },
        columnStats
      );

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Resposta inválida');

      const parsed: ChartSuggestionsResponse = JSON.parse(jsonMatch[0]);
      setChartSuggestions(parsed.suggestions ?? []);
    } catch {
      // Silently fail — suggestions are optional
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [headers, columnTypes, columnStats, setChartSuggestions, setIsLoadingSuggestions]);

  return { analyzeDataset, sendChatMessage, suggestCharts };
}

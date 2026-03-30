import { create } from 'zustand';
import type { ChatMessage, DatasetAnalysis, ChartSuggestion } from '../types/ai.types';
import type { AnomalyDetail } from '../utils/anomalyDetector';
import type { CodeLanguage } from '../utils/codeFormatter';

interface AIState {
  // ── Existing: auto analysis ──────────────────────────────────────────
  isAnalyzing: boolean;
  autoAnalysis: DatasetAnalysis | null;
  analysisError: string | null;

  // ── Existing: chat ───────────────────────────────────────────────────
  chatHistory: ChatMessage[];
  isLoadingChat: boolean;
  chatError: string | null;
  streamingChatContent: string;

  // ── Existing: chart suggestions ──────────────────────────────────────
  chartSuggestions: ChartSuggestion[];
  isLoadingSuggestions: boolean;

  // ── New: report generation ───────────────────────────────────────────
  isGeneratingReport: boolean;
  reportMarkdown: string;
  reportError: string | null;

  // ── New: anomaly detection ───────────────────────────────────────────
  isDetectingAnomalies: boolean;
  anomalyRowIndices: number[];
  anomalyDetails: AnomalyDetail[];
  anomalySummary: string;
  anomalyError: string | null;

  // ── New: code generation ─────────────────────────────────────────────
  isGeneratingCode: boolean;
  generatedCode: string;
  generatedCodeLang: CodeLanguage;
  codeError: string | null;

  // ── Actions ──────────────────────────────────────────────────────────
  setIsAnalyzing: (v: boolean) => void;
  setAutoAnalysis: (analysis: DatasetAnalysis | null) => void;
  setAnalysisError: (err: string | null) => void;

  addChatMessage: (msg: ChatMessage) => void;
  setIsLoadingChat: (v: boolean) => void;
  setChatError: (err: string | null) => void;
  clearChat: () => void;
  setStreamingChatContent: (content: string) => void;
  appendStreamingChatContent: (chunk: string) => void;

  setChartSuggestions: (suggestions: ChartSuggestion[]) => void;
  setIsLoadingSuggestions: (v: boolean) => void;

  setIsGeneratingReport: (v: boolean) => void;
  setReportMarkdown: (content: string) => void;
  appendReportMarkdown: (chunk: string) => void;
  setReportError: (err: string | null) => void;
  clearReport: () => void;

  setIsDetectingAnomalies: (v: boolean) => void;
  setAnomalyResult: (indices: number[], details: AnomalyDetail[], summary: string) => void;
  setAnomalyError: (err: string | null) => void;
  clearAnomalies: () => void;

  setIsGeneratingCode: (v: boolean) => void;
  setGeneratedCode: (code: string, lang: CodeLanguage) => void;
  setCodeError: (err: string | null) => void;

  resetAI: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  isAnalyzing: false,
  autoAnalysis: null,
  analysisError: null,

  chatHistory: [],
  isLoadingChat: false,
  chatError: null,
  streamingChatContent: '',

  chartSuggestions: [],
  isLoadingSuggestions: false,

  isGeneratingReport: false,
  reportMarkdown: '',
  reportError: null,

  isDetectingAnomalies: false,
  anomalyRowIndices: [],
  anomalyDetails: [],
  anomalySummary: '',
  anomalyError: null,

  isGeneratingCode: false,
  generatedCode: '',
  generatedCodeLang: 'python',
  codeError: null,

  // existing actions
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setAutoAnalysis: (analysis) => set({ autoAnalysis: analysis }),
  setAnalysisError: (err) => set({ analysisError: err }),

  addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  setIsLoadingChat: (v) => set({ isLoadingChat: v }),
  setChatError: (err) => set({ chatError: err }),
  clearChat: () => set({ chatHistory: [], chatError: null, streamingChatContent: '' }),
  setStreamingChatContent: (content) => set({ streamingChatContent: content }),
  appendStreamingChatContent: (chunk) =>
    set((s) => ({ streamingChatContent: s.streamingChatContent + chunk })),

  setChartSuggestions: (suggestions) => set({ chartSuggestions: suggestions }),
  setIsLoadingSuggestions: (v) => set({ isLoadingSuggestions: v }),

  // report actions
  setIsGeneratingReport: (v) => set({ isGeneratingReport: v }),
  setReportMarkdown: (content) => set({ reportMarkdown: content }),
  appendReportMarkdown: (chunk) =>
    set((s) => ({ reportMarkdown: s.reportMarkdown + chunk })),
  setReportError: (err) => set({ reportError: err }),
  clearReport: () => set({ reportMarkdown: '', reportError: null }),

  // anomaly actions
  setIsDetectingAnomalies: (v) => set({ isDetectingAnomalies: v }),
  setAnomalyResult: (indices, details, summary) =>
    set({ anomalyRowIndices: indices, anomalyDetails: details, anomalySummary: summary }),
  setAnomalyError: (err) => set({ anomalyError: err }),
  clearAnomalies: () =>
    set({ anomalyRowIndices: [], anomalyDetails: [], anomalySummary: '', anomalyError: null }),

  // code gen actions
  setIsGeneratingCode: (v) => set({ isGeneratingCode: v }),
  setGeneratedCode: (code, lang) => set({ generatedCode: code, generatedCodeLang: lang }),
  setCodeError: (err) => set({ codeError: err }),

  resetAI: () => set({
    isAnalyzing: false,
    autoAnalysis: null,
    analysisError: null,
    chatHistory: [],
    isLoadingChat: false,
    chatError: null,
    streamingChatContent: '',
    chartSuggestions: [],
    isLoadingSuggestions: false,
    isGeneratingReport: false,
    reportMarkdown: '',
    reportError: null,
    isDetectingAnomalies: false,
    anomalyRowIndices: [],
    anomalyDetails: [],
    anomalySummary: '',
    anomalyError: null,
    isGeneratingCode: false,
    generatedCode: '',
    generatedCodeLang: 'python',
    codeError: null,
  }),
}));

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DatasetAnalysis {
  description: string;
  insights: string[];
  qualityIssues: string[];
  suggestions: string[];
}

export type ChartType = 'bar' | 'line' | 'scatter' | 'histogram';

export interface ChartSuggestion {
  type: ChartType;
  columns: string[];
  title: string;
  reasoning: string;
}

export interface ChartSuggestionsResponse {
  suggestions: ChartSuggestion[];
}

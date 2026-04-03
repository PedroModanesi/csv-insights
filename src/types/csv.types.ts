export type ColumnType = 'number' | 'date' | 'boolean' | 'category' | 'text';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  index: number;
}

export interface NumericStats {
  type: 'number';
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  count: number;
  nullCount: number;
}

export interface CategoryStats {
  type: 'category';
  uniqueCount: number;
  topValue: string;
  topValueCount: number;
  count: number;
  nullCount: number;
  frequencies: Record<string, number>;
}

export interface DateStats {
  type: 'date';
  oldest: string;
  newest: string;
  spanDays: number;
  count: number;
  nullCount: number;
}

export interface TextStats {
  type: 'text';
  uniqueCount: number;
  count: number;
  nullCount: number;
}

export interface BooleanStats {
  type: 'boolean';
  trueCount: number;
  falseCount: number;
  count: number;
  nullCount: number;
}

export type ColumnStats = NumericStats | CategoryStats | DateStats | TextStats | BooleanStats;

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  column: string;
  value: string;
}

export type CSVRow = Record<string, string>;

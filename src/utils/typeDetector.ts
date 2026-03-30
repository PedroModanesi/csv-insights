import type { ColumnType } from '../types/csv.types';

const BOOLEAN_VALUES = new Set(['true', 'false', 'yes', 'no', '1', '0', 'sim', 'não', 'nao']);
const MAX_CATEGORY_UNIQUE = 15;
const SAMPLE_SIZE = 200;
const TYPE_THRESHOLD = 0.8;

/**
 * Checks if a value can be parsed as a finite float.
 */
function isNumeric(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  const num = parseFloat(trimmed.replace(',', '.'));
  return !isNaN(num) && isFinite(num);
}

/**
 * Checks if a value can be parsed as a valid date.
 */
function isDate(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  const timestamp = Date.parse(trimmed);
  return !isNaN(timestamp);
}

/**
 * Detects the type of a single column based on a sample of its values.
 * Analyzes up to SAMPLE_SIZE rows to determine the most appropriate type.
 */
export function detectColumnType(values: string[]): ColumnType {
  const sample = values.slice(0, SAMPLE_SIZE).filter(v => v.trim() !== '');

  if (sample.length === 0) return 'text';

  // Check boolean first (most restrictive)
  const uniqueValues = new Set(sample.map(v => v.trim().toLowerCase()));
  if ([...uniqueValues].every(v => BOOLEAN_VALUES.has(v))) {
    return 'boolean';
  }

  // Check number
  const numericCount = sample.filter(isNumeric).length;
  if (numericCount / sample.length >= TYPE_THRESHOLD) {
    return 'number';
  }

  // Check date
  const dateCount = sample.filter(isDate).length;
  if (dateCount / sample.length >= TYPE_THRESHOLD) {
    return 'date';
  }

  // Check category (text with few unique values)
  if (uniqueValues.size <= MAX_CATEGORY_UNIQUE) {
    return 'category';
  }

  return 'text';
}

/**
 * Detects the types for all columns in the dataset.
 * Returns a map of column name → detected type.
 */
export function detectColumnTypes(
  headers: string[],
  rows: Record<string, string>[]
): Record<string, ColumnType> {
  const result: Record<string, ColumnType> = {};

  for (const header of headers) {
    const values = rows.map(row => row[header] ?? '');
    result[header] = detectColumnType(values);
  }

  return result;
}

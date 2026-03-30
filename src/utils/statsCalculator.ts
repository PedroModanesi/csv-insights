import type { ColumnType, ColumnStats, NumericStats, CategoryStats, DateStats, TextStats, BooleanStats } from '../types/csv.types';

type CSVRow = Record<string, string>;

/**
 * Calculates the median of a sorted numeric array.
 */
function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates standard deviation for a list of numbers.
 */
function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function calcNumericStats(values: string[]): NumericStats {
  const nullCount = values.filter(v => v.trim() === '').length;
  const nums = values
    .filter(v => v.trim() !== '')
    .map(v => parseFloat(v.trim().replace(',', '.')))
    .filter(n => !isNaN(n) && isFinite(n))
    .sort((a, b) => a - b);

  const count = nums.length;
  const min = count > 0 ? nums[0] : 0;
  const max = count > 0 ? nums[count - 1] : 0;
  const mean = count > 0 ? nums.reduce((s, v) => s + v, 0) / count : 0;
  const med = count > 0 ? median(nums) : 0;

  return { type: 'number', min, max, mean, median: med, stdDev: stdDev(nums, mean), count, nullCount };
}

function calcCategoryStats(values: string[]): CategoryStats {
  const nullCount = values.filter(v => v.trim() === '').length;
  const nonEmpty = values.filter(v => v.trim() !== '');
  const frequencies: Record<string, number> = {};

  for (const v of nonEmpty) {
    const key = v.trim();
    frequencies[key] = (frequencies[key] ?? 0) + 1;
  }

  const entries = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);
  const [topValue, topValueCount] = entries[0] ?? ['', 0];

  return {
    type: 'category',
    uniqueCount: entries.length,
    topValue,
    topValueCount,
    count: nonEmpty.length,
    nullCount,
    frequencies,
  };
}

function calcDateStats(values: string[]): DateStats {
  const nullCount = values.filter(v => v.trim() === '').length;
  const timestamps = values
    .filter(v => v.trim() !== '')
    .map(v => Date.parse(v.trim()))
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b);

  const count = timestamps.length;
  const oldest = count > 0 ? new Date(timestamps[0]).toLocaleDateString() : '';
  const newest = count > 0 ? new Date(timestamps[count - 1]).toLocaleDateString() : '';
  const spanDays = count > 1
    ? Math.round((timestamps[count - 1] - timestamps[0]) / (1000 * 60 * 60 * 24))
    : 0;

  return { type: 'date', oldest, newest, spanDays, count, nullCount };
}

function calcTextStats(values: string[]): TextStats {
  const nullCount = values.filter(v => v.trim() === '').length;
  const nonEmpty = values.filter(v => v.trim() !== '');
  const uniqueCount = new Set(nonEmpty).size;
  return { type: 'text', uniqueCount, count: nonEmpty.length, nullCount };
}

function calcBooleanStats(values: string[]): BooleanStats {
  const nullCount = values.filter(v => v.trim() === '').length;
  const trueValues = new Set(['true', 'yes', '1', 'sim']);
  let trueCount = 0;
  let falseCount = 0;

  for (const v of values) {
    const lower = v.trim().toLowerCase();
    if (lower === '') continue;
    if (trueValues.has(lower)) trueCount++;
    else falseCount++;
  }

  return { type: 'boolean', trueCount, falseCount, count: trueCount + falseCount, nullCount };
}

/**
 * Computes statistics for all columns based on their detected types.
 */
export function calculateColumnStats(
  headers: string[],
  rows: CSVRow[],
  columnTypes: Record<string, ColumnType>
): Record<string, ColumnStats> {
  const result: Record<string, ColumnStats> = {};

  for (const header of headers) {
    const values = rows.map(row => row[header] ?? '');
    const type = columnTypes[header] ?? 'text';

    switch (type) {
      case 'number':
        result[header] = calcNumericStats(values);
        break;
      case 'category':
        result[header] = calcCategoryStats(values);
        break;
      case 'date':
        result[header] = calcDateStats(values);
        break;
      case 'boolean':
        result[header] = calcBooleanStats(values);
        break;
      default:
        result[header] = calcTextStats(values);
    }
  }

  return result;
}

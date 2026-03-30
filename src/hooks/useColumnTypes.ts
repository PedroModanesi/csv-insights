import { useEffect } from 'react';
import { detectColumnTypes } from '../utils/typeDetector';
import { calculateColumnStats } from '../utils/statsCalculator';
import { useCSVStore } from '../store/csvStore';

/**
 * Automatically detects column types and calculates stats
 * whenever the raw CSV data changes.
 */
export function useColumnTypes() {
  const { rawData, headers, setColumnTypes, setColumnStats } = useCSVStore();

  useEffect(() => {
    if (rawData.length === 0 || headers.length === 0) return;

    const types = detectColumnTypes(headers, rawData);
    setColumnTypes(types);

    const stats = calculateColumnStats(headers, rawData, types);
    setColumnStats(stats);
  }, [rawData, headers, setColumnTypes, setColumnStats]);
}

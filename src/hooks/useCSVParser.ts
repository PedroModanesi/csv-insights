import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { CSVRow } from '../types/csv.types';

interface ParseResult {
  data: CSVRow[];
  headers: string[];
  error: string | null;
}

interface UseCSVParserReturn {
  parse: (file: File) => void;
  isLoading: boolean;
  progress: number;
  error: string | null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function useCSVParser(onComplete: (result: ParseResult) => void): UseCSVParserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback((file: File) => {
    if (!file.name.match(/\.csv$/i)) {
      setError('Arquivo inválido. Selecione um arquivo .csv');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Máximo permitido: 50MB');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    let headers: string[] = [];
    const rows: CSVRow[] = [];

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      // Try to detect the delimiter automatically
      delimiter: '',
      worker: false,
      step: (results, parser) => {
        if (results.errors.length > 0) {
          return;
        }

        const row = results.data as string[];

        if (headers.length === 0) {
          headers = row.map(h => h.trim());
        } else {
          const obj: CSVRow = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] ?? '';
          });
          rows.push(obj);
        }

        // Estimate progress based on bytes read
        const bytesRead = (parser as unknown as { streamer: { _input: { length: number } } })?.streamer?._input?.length;
        if (bytesRead) {
          setProgress(Math.min(90, Math.round((bytesRead / file.size) * 100)));
        }
      },
      complete: () => {
        setProgress(100);
        setIsLoading(false);

        if (headers.length === 0) {
          setError('Não foi possível ler os cabeçalhos do arquivo.');
          onComplete({ data: [], headers: [], error: 'Cabeçalhos não encontrados' });
          return;
        }

        onComplete({ data: rows, headers, error: null });
      },
      error: (err) => {
        setIsLoading(false);
        const msg = `Erro ao processar arquivo: ${err.message}`;
        setError(msg);
        onComplete({ data: [], headers: [], error: msg });
      },
    });
  }, [onComplete]);

  return { parse, isLoading, progress, error };
}

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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

function parseXLSX(file: File, onComplete: (result: ParseResult) => void, setProgress: (n: number) => void, setError: (s: string | null) => void, setIsLoading: (b: boolean) => void) {
  const reader = new FileReader();

  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      setProgress(Math.min(80, Math.round((e.loaded / e.total) * 80)));
    }
  };

  reader.onload = (e) => {
    try {
      setProgress(85);
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      // Use first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to array of arrays
      const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (raw.length === 0) {
        const msg = 'Planilha vazia ou sem dados.';
        setError(msg);
        onComplete({ data: [], headers: [], error: msg });
        setIsLoading(false);
        return;
      }

      const headers = (raw[0] as unknown[]).map(h => String(h ?? '').trim());
      const rows: CSVRow[] = raw.slice(1).map(row => {
        const obj: CSVRow = {};
        headers.forEach((h, i) => {
          obj[h] = String(row[i] ?? '');
        });
        return obj;
      });

      setProgress(100);
      setIsLoading(false);
      onComplete({ data: rows, headers, error: null });
    } catch (err) {
      const msg = `Erro ao processar XLSX: ${err instanceof Error ? err.message : String(err)}`;
      setError(msg);
      setIsLoading(false);
      onComplete({ data: [], headers: [], error: msg });
    }
  };

  reader.onerror = () => {
    const msg = 'Erro ao ler o arquivo.';
    setError(msg);
    setIsLoading(false);
    onComplete({ data: [], headers: [], error: msg });
  };

  reader.readAsArrayBuffer(file);
}

export function useCSVParser(onComplete: (result: ParseResult) => void): UseCSVParserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback((file: File) => {
    const isCSV = file.name.match(/\.csv$/i);
    const isXLSX = file.name.match(/\.(xlsx|xls)$/i);

    if (!isCSV && !isXLSX) {
      setError('Arquivo inválido. Selecione um arquivo .csv, .xlsx ou .xls');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Máximo permitido: 50MB');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    if (isXLSX) {
      parseXLSX(file, onComplete, setProgress, setError, setIsLoading);
      return;
    }

    // CSV path (unchanged)
    let headers: string[] = [];
    const rows: CSVRow[] = [];

    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      delimiter: '',
      worker: false,
      step: (results, parser) => {
        if (results.errors.length > 0) return;

        const row = results.data as string[];

        if (headers.length === 0) {
          headers = row.map(h => h.trim());
        } else {
          const obj: CSVRow = {};
          headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
          rows.push(obj);
        }

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

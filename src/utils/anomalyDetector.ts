import type { ColumnType, ColumnStats, CSVRow } from '../types/csv.types';

interface SchemaInfo {
  headers: string[];
  columnTypes: Record<string, ColumnType>;
}

export interface AnomalyDetail {
  rowIndex: number;
  column: string;
  value: string;
  reason: string;
}

export interface AnomalyResult {
  anomalyRowIndices: number[];
  details: AnomalyDetail[];
  duplicateGroups: number[][];
  summary: string;
}

function formatNumericStats(header: string, stats: ColumnStats): string {
  if (stats.type !== 'number') return '';
  return `${header}: mín=${stats.min.toFixed(2)}, máx=${stats.max.toFixed(2)}, média=${stats.mean.toFixed(2)}, desvPad=${stats.stdDev.toFixed(2)}`;
}

export function buildAnomalyPrompt(
  schema: SchemaInfo,
  stats: Record<string, ColumnStats>,
  sampleRows: CSVRow[],
  maxRows: number
): string {
  const numericHeaders = schema.headers.filter(h => schema.columnTypes[h] === 'number');

  const numericStatsLines = numericHeaders
    .map(h => stats[h] ? `- ${formatNumericStats(h, stats[h])}` : '')
    .filter(Boolean)
    .join('\n');

  const rows = sampleRows.slice(0, maxRows);
  const indexedRows = rows.map((row, i) => ({ _idx: i, ...row }));
  const dataJson = JSON.stringify(indexedRows, null, 2);

  return `Você é um especialista em qualidade de dados. Analise os dados abaixo e identifique anomalias, outliers e problemas.

## Schema
${schema.headers.map(h => `- ${h}: ${schema.columnTypes[h]}`).join('\n')}

## Estatísticas Numéricas (base para detectar outliers)
${numericStatsLines || '(nenhuma coluna numérica)'}

## Dados a Analisar (${rows.length} linhas, campo _idx = índice da linha)
${dataJson}

## Instruções
Identifique:
1. **Outliers numéricos**: valores que excedam 3 desvios padrão da média, ou valores negativos onde não faz sentido (ex: preço negativo, idade negativa)
2. **Valores suspeitos**: datas no futuro, valores impossíveis para o domínio
3. **Linhas duplicadas ou quase duplicadas**: linhas com todos os valores iguais ou muito semelhantes

Retorne APENAS um JSON válido (sem markdown, sem texto extra) no formato:
{
  "anomalyRowIndices": [0, 5, 12],
  "details": [
    {
      "rowIndex": 0,
      "column": "nome_da_coluna",
      "value": "valor_problemático",
      "reason": "descrição em português do problema"
    }
  ],
  "duplicateGroups": [[3, 7], [15, 22, 30]],
  "summary": "Resumo em português do que foi encontrado"
}

Se não encontrar anomalias, retorne arrays vazios e summary explicando que os dados parecem corretos.`;
}

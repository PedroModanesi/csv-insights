import type { ColumnType, ColumnStats, CSVRow } from '../types/csv.types';

interface SchemaInfo {
  headers: string[];
  columnTypes: Record<string, ColumnType>;
}

function formatStatsForReport(header: string, stats: ColumnStats): string {
  switch (stats.type) {
    case 'number':
      return `**${header}** (numérico): mín=${stats.min.toFixed(2)}, máx=${stats.max.toFixed(2)}, média=${stats.mean.toFixed(2)}, mediana=${stats.median.toFixed(2)}, desvPad=${stats.stdDev.toFixed(2)}, registros=${stats.count}, nulos=${stats.nullCount}`;
    case 'category':
      return `**${header}** (categórico): ${stats.uniqueCount} valores únicos, mais frequente="${stats.topValue}" (${stats.topValueCount}x), registros=${stats.count}, nulos=${stats.nullCount}`;
    case 'date':
      return `**${header}** (data): de ${stats.oldest} até ${stats.newest} (${stats.spanDays} dias), registros=${stats.count}, nulos=${stats.nullCount}`;
    case 'boolean':
      return `**${header}** (booleano): verdadeiro=${stats.trueCount}, falso=${stats.falseCount}, nulos=${stats.nullCount}`;
    default:
      return `**${header}** (texto): ${stats.uniqueCount} valores únicos, registros=${stats.count}, nulos=${stats.nullCount}`;
  }
}

export function buildReportPrompt(
  schema: SchemaInfo,
  stats: Record<string, ColumnStats>,
  sampleRows: CSVRow[],
  fileName: string,
  totalRows: number
): string {
  const usefulHeaders = schema.headers.filter(h => {
    if (!h.trim()) return false;
    const s = stats[h];
    return s && s.count > 0;
  });

  const schemaLines = usefulHeaders
    .map(h => `- ${h}: ${schema.columnTypes[h]}`)
    .join('\n');

  const statsLines = usefulHeaders
    .map(h => `- ${formatStatsForReport(h, stats[h])}`)
    .join('\n');

  const cleanSample = sampleRows.slice(0, 8).map(row => {
    const cleaned: CSVRow = {};
    for (const h of usefulHeaders) cleaned[h] = row[h] ?? '';
    return cleaned;
  });

  const sampleJson = JSON.stringify(cleanSample, null, 2);

  return `Você é um analista de dados sênior. Gere um relatório completo e profissional em Markdown sobre o dataset a seguir. Responda SOMENTE em português brasileiro.

## Dataset
- **Arquivo:** ${fileName}
- **Total de linhas:** ${totalRows.toLocaleString('pt-BR')}
- **Total de colunas:** ${usefulHeaders.length}

## Schema
${schemaLines}

## Estatísticas por Coluna
${statsLines}

## Amostra de Dados (${cleanSample.length} linhas)
\`\`\`json
${sampleJson}
\`\`\`

---

Gere um relatório completo em Markdown com as seguintes seções:

# Relatório de Análise: ${fileName}

## 1. Sumário Executivo
(Visão geral do dataset em 3-4 parágrafos: o que são os dados, período coberto se houver datas, dimensão e relevância)

## 2. Análise por Coluna
(Para cada coluna relevante: tipo detectado, distribuição, valores notáveis, interpretação dos dados)

## 3. Insights e Padrões Encontrados
(Pelo menos 5 insights interessantes baseados nas estatísticas)

## 4. Qualidade dos Dados
(Avaliação de nulos, inconsistências, outliers potenciais, problemas identificados)

## 5. Recomendações de Limpeza
(Sugestões concretas e acionáveis para melhorar a qualidade dos dados)

## 6. Próximos Passos Sugeridos
(3-5 análises que o usuário deveria considerar fazer com esses dados)

Seja detalhado, preciso e use os dados estatísticos para embasar cada afirmação.`;
}

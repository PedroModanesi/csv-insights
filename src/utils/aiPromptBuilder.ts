import type { ColumnType, ColumnStats } from '../types/csv.types';

type CSVRow = Record<string, string>;

interface SchemaInfo {
  headers: string[];
  columnTypes: Record<string, ColumnType>;
}

/**
 * Formats column stats into a human-readable summary string for the AI prompt.
 */
function formatStats(header: string, stats: ColumnStats): string {
  switch (stats.type) {
    case 'number':
      return `${header} (number): min=${stats.min.toFixed(2)}, max=${stats.max.toFixed(2)}, mean=${stats.mean.toFixed(2)}, median=${stats.median.toFixed(2)}, stdDev=${stats.stdDev.toFixed(2)}, count=${stats.count}, nulls=${stats.nullCount}`;
    case 'category':
      return `${header} (category): ${stats.uniqueCount} unique values, most frequent="${stats.topValue}" (${stats.topValueCount}x), count=${stats.count}, nulls=${stats.nullCount}`;
    case 'date':
      return `${header} (date): from ${stats.oldest} to ${stats.newest} (${stats.spanDays} days), count=${stats.count}, nulls=${stats.nullCount}`;
    case 'boolean':
      return `${header} (boolean): true=${stats.trueCount}, false=${stats.falseCount}, nulls=${stats.nullCount}`;
    default:
      return `${header} (text): ${stats.uniqueCount} unique values, count=${stats.count}, nulls=${stats.nullCount}`;
  }
}

/**
 * Builds the prompt for automatic dataset analysis (Mode A).
 * Sends schema + stats + sample rows to Claude for an overview.
 */
export function buildDatasetAnalysisPrompt(
  schema: SchemaInfo,
  stats: Record<string, ColumnStats>,
  sampleRows: CSVRow[]
): string {
  const usefulHeaders = schema.headers.filter(h => {
    if (!h.trim()) return false;
    const s = stats[h];
    return s && s.count > 0;
  });

  const schemaLines = usefulHeaders
    .map(h => `  - ${h}: ${schema.columnTypes[h]}`)
    .join('\n');

  const statsLines = usefulHeaders
    .map(h => `  - ${formatStats(h, stats[h])}`)
    .join('\n');

  const cleanSample = sampleRows.slice(0, 5).map(row => {
    const cleaned: CSVRow = {};
    for (const h of usefulHeaders) cleaned[h] = row[h] ?? '';
    return cleaned;
  });

  const sampleJson = JSON.stringify(cleanSample, null, 2);

  return `Você é um analista de dados especialista. Analise o dataset a seguir e responda em português.

SCHEMA DO DATASET:
${schemaLines}

ESTATÍSTICAS POR COLUNA:
${statsLines}

AMOSTRA DE DADOS (5 linhas):
${sampleJson}

Por favor, forneça:
1. Uma descrição do que parece ser este dataset (2-3 frases)
2. Exatamente 3 insights interessantes sobre os dados
3. Possíveis problemas de qualidade de dados que você identificou
4. Exatamente 3 sugestões de análises que o usuário poderia fazer

Responda em formato JSON estruturado assim:
{
  "description": "...",
  "insights": ["insight1", "insight2", "insight3"],
  "qualityIssues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;
}

/**
 * Builds the system prompt for free chat mode (Mode B).
 */
export function buildChatSystemPrompt(
  schema: SchemaInfo,
  stats: Record<string, ColumnStats>,
  sampleRows: CSVRow[]
): string {
  // Filter out unnamed or fully-empty columns
  const usefulHeaders = schema.headers.filter(h => {
    if (!h.trim()) return false;
    const s = stats[h];
    if (!s) return false;
    return s.count > 0;
  });

  const totalRows = sampleRows.length;

  const schemaLines = usefulHeaders
    .map(h => `  - ${h} (${schema.columnTypes[h]})`)
    .join('\n');

  const statsLines = usefulHeaders
    .map(h => `  - ${formatStats(h, stats[h])}`)
    .join('\n');

  // Clean sample: only include useful columns, up to 30 rows
  const cleanSample = sampleRows.slice(0, 30).map(row => {
    const cleaned: CSVRow = {};
    for (const h of usefulHeaders) cleaned[h] = row[h] ?? '';
    return cleaned;
  });

  const sampleJson = JSON.stringify(cleanSample, null, 2);

  return `Você é um assistente especialista em análise de dados. Responda SEMPRE em português brasileiro.

INSTRUÇÕES:
- Responda de forma direta e objetiva.
- Use os dados e estatísticas abaixo para embasar suas respostas.
- Se o usuário perguntar sobre um valor específico, busque na amostra de dados.
- Se a pergunta exigir cálculo sobre todos os dados e a amostra for insuficiente, estime com base nas estatísticas e avise o usuário.
- Não invente dados que não estão no contexto.
- Prefira texto simples. Use listas quando ajudar a clareza.

DATASET (${totalRows} linhas no total):

Colunas disponíveis:
${schemaLines}

Estatísticas calculadas sobre todos os dados:
${statsLines}

Amostra de dados (primeiras ${cleanSample.length} linhas):
${sampleJson}`;
}

/**
 * Builds the prompt for chart suggestion mode (Mode C).
 */
export function buildChartSuggestionsPrompt(
  schema: SchemaInfo,
  stats: Record<string, ColumnStats>
): string {
  const schemaLines = schema.headers
    .map(h => `  - ${h}: ${schema.columnTypes[h]}`)
    .join('\n');

  const statsLines = schema.headers
    .map(h => stats[h] ? `  - ${formatStats(h, stats[h])}` : '')
    .filter(Boolean)
    .join('\n');

  return `Você é um especialista em visualização de dados. Sugira os melhores gráficos para este dataset.

Schema:
${schemaLines}

Estatísticas:
${statsLines}

Retorne APENAS um JSON válido (sem markdown, sem texto extra) com exatamente este formato:
{
  "suggestions": [
    {
      "type": "bar" | "line" | "scatter" | "histogram",
      "columns": ["coluna1", "coluna2"],
      "title": "Título do gráfico",
      "reasoning": "Por que este gráfico é relevante"
    }
  ]
}

Forneça entre 3 e 6 sugestões relevantes. Use apenas colunas que existem no schema.`;
}

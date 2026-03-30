import type { ColumnType, ColumnStats } from '../types/csv.types';

interface SchemaInfo {
  headers: string[];
  columnTypes: Record<string, ColumnType>;
}

export type CodeLanguage = 'python' | 'sql';

export function buildCodeGenPrompt(
  schema: SchemaInfo,
  stats: Record<string, ColumnStats>,
  description: string,
  language: CodeLanguage
): string {
  const schemaLines = schema.headers
    .map(h => `- ${h} (${schema.columnTypes[h]})`)
    .join('\n');

  const numericCols = schema.headers.filter(h => schema.columnTypes[h] === 'number');
  const categoryCols = schema.headers.filter(h => schema.columnTypes[h] === 'category');
  const dateCols = schema.headers.filter(h => schema.columnTypes[h] === 'date');

  const statsHints: string[] = [];
  for (const h of numericCols.slice(0, 5)) {
    const s = stats[h];
    if (s?.type === 'number') {
      statsHints.push(`- ${h}: mín=${s.min.toFixed(2)}, máx=${s.max.toFixed(2)}, média=${s.mean.toFixed(2)}`);
    }
  }

  const langInstructions = language === 'python'
    ? `Gere código Python usando pandas. Suponha que o DataFrame já está carregado na variável \`df\` com as colunas descritas abaixo. Use pandas de forma idiomática. Importe apenas o necessário.`
    : `Gere código SQL padrão (compatível com PostgreSQL/MySQL). Suponha que os dados estão em uma tabela chamada \`dataset\` com as colunas descritas abaixo. Use aliases claros e formate o SQL de forma legível.`;

  return `Você é um especialista em análise de dados. ${langInstructions}

## Schema do Dataset
${schemaLines}

${numericCols.length > 0 ? `Colunas numéricas: ${numericCols.join(', ')}` : ''}
${categoryCols.length > 0 ? `Colunas categóricas: ${categoryCols.join(', ')}` : ''}
${dateCols.length > 0 ? `Colunas de data: ${dateCols.join(', ')}` : ''}

${statsHints.length > 0 ? `## Estatísticas de referência\n${statsHints.join('\n')}` : ''}

## Análise solicitada pelo usuário
${description}

## Instruções
- Gere APENAS o código ${language === 'python' ? 'Python' : 'SQL'}, sem explicações antes ou depois
- O código deve estar dentro de um bloco de código markdown com a linguagem correta
- Adicione comentários breves em português explicando as etapas principais
- O código deve ser funcional e pronto para execução`;
}

export function extractCodeFromResponse(response: string, language: CodeLanguage): string {
  // Try to find a fenced code block with the specific language
  const fenced = new RegExp(`\`\`\`${language}\\s*\\n([\\s\\S]+?)\`\`\``, 'i');
  const match = response.match(fenced);
  if (match) return match[1].trim();

  // Fallback: any fenced code block
  const anyFenced = response.match(/```[\w]*\n([\s\S]+?)```/);
  if (anyFenced) return anyFenced[1].trim();

  return response.trim();
}

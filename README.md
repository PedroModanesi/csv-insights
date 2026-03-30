# CSV Insights

Visualizador de arquivos CSV com análise automática de dados e integração com IA (Gemini).

## Funcionalidades

- **Upload de CSV** — Drag-and-drop com suporte a vírgula, ponto-e-vírgula e tab. Máx. 50MB.
- **Detecção de tipos** — Identifica automaticamente: número, data, booleano, categoria e texto.
- **Tabela interativa** — Paginação, ordenação, busca global e filtro por coluna.
- **Estatísticas** — Mín/máx/média/mediana para numéricas, frequência para categóricas, span de datas.
- **Gráficos** — Histogramas para numéricas, barras para categóricas. Geração automática por IA.
- **IA — Análise automática** — Claude descreve o dataset e sugere análises ao carregar o arquivo.
- **IA — Chat livre** — Pergunte sobre seus dados em linguagem natural.
- **IA — Sugestões de gráfico** — Claude sugere as melhores visualizações para o dataset.
- **Dark mode** — Detectado automaticamente via `prefers-color-scheme`.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · Papaparse · Recharts · Google Generative AI SDK · Zustand

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```
VITE_GEMINI_API_KEY=sua_chave_aqui
```

Obtenha sua chave em: https://aistudio.google.com/apikey


## Instalação

```bash
cd csv-insights
npm install
cp .env
# Edite .env e adicione sua VITE_GEMINI_API_KEY
npm run dev
```

## Como usar a IA

### Modo A — Análise automática
Ao carregar um CSV, o Gemini analisa automaticamente o dataset e exibe:
- Descrição do que parece ser o dataset
- 3 principais insights sobre os dados
- Problemas de qualidade identificados
- 3 sugestões de análises a fazer

### Modo B — Chat livre
Na aba **Chat IA**, faça perguntas em linguagem natural sobre seus dados. Exemplos:
- "Qual é a distribuição da coluna X?"
- "Quais são os valores mais comuns?"
- "Existe correlação entre X e Y?"

O Gemini tem acesso ao schema, estatísticas e até 50 linhas de amostra.

### Modo C — Sugestões de visualização
No painel de Gráficos, clique em **"✨ Sugerir gráficos"**. O Claude retorna sugestões clicáveis que geram o gráfico automaticamente.

## Nota de segurança

A chave da API é usada diretamente no browser. Para produção, use um backend proxy.

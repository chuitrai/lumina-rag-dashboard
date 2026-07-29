import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import express from 'express';
import { PROMPT_PRESETS, type PromptPreset } from '../src/config/promptPresets.js';

export type RagMethod = 'bm25' | 'dense' | 'hybrid';
export type RerankerMode = 'none' | 'jina-reranker-v2';

interface ViHermesRecord {
  id: string;
  question: string;
  answer: string;
  hop_level?: number;
  evidence?: Record<string, string>;
  context_block?: string;
}

interface RagDocument {
  id: string;
  content: string;
  source: string;
  metadata: Record<string, string | number>;
}

interface ScoredDocument {
  doc: RagDocument;
  score: number;
  originalRank: number;
  retrievalScore?: number;
  rerankScore?: number;
}

interface EvaluationReference {
  answer: string;
  evidenceIds: string[];
}

interface FewShotExample {
  question: string;
  answer: string;
  evidence: string;
}

const serverDir = path.dirname(fileURLToPath(import.meta.url));
export const projectDir = path.resolve(serverDir, '..');
const workspaceDir = path.resolve(projectDir, '..');
const bundledDatasetPath = path.join(projectDir, 'dataset.jsonl');
const datasetPath = path.resolve(
  process.env.VIHERMES_DATASET_PATH
    || (fs.existsSync(bundledDatasetPath)
      ? bundledDatasetPath
      : path.join(workspaceDir, 'Vi-HERMES', 'dataset', 'dataset.jsonl')),
);
// Vercel functions ship a read-only filesystem except /tmp — writing the dense
// embedding cache anywhere else would throw EROFS the moment Dense/Hybrid is used.
const cacheDir = path.resolve(
  process.env.RAG_CACHE_DIR
    || (process.env.VERCEL ? '/tmp/vihermes-rag-cache' : path.join(projectDir, '.rag-cache')),
);
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiApiBaseUrl = (process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
// "gemini-2.5-flash" (the dated model id) has been retired for new API keys —
// Google now recommends the "-latest" alias, which always resolves to whatever
// current flash model that key has access to instead of a fixed dated version.
const defaultLlmModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const jinaApiKey = process.env.JINA_API_KEY || '';
const jinaApiBaseUrl = (process.env.JINA_API_BASE_URL || 'https://api.jina.ai/v1').replace(/\/$/, '');
const defaultEmbeddingModel = process.env.JINA_EMBED_MODEL || 'jina-embeddings-v3';
const defaultRerankerModel = process.env.JINA_RERANK_MODEL || 'jina-reranker-v2-base-multilingual';
const evaluationEmbeddingModel = defaultEmbeddingModel;
const embeddingInputFormat = 'jina-retrieval-task-v1';

export const app = express();
app.use(express.json({ limit: '2mb' }));

let documents: RagDocument[] = [];
let examples: Array<Pick<ViHermesRecord, 'id' | 'question' | 'hop_level'>> = [];
let evaluationReferences = new Map<string, EvaluationReference>();
let fewShotExamples: FewShotExample[] = [];
let documentTokens: string[][] = [];
let documentTermFrequency: Array<Map<string, number>> = [];
let documentFrequency = new Map<string, number>();
let averageDocumentLength = 0;
let denseEmbeddings: number[][] | null = null;
let denseEmbeddingModel: string | null = null;
let indexBuildPromise: Promise<void> | null = null;

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(/\s+/).filter((token) => token.length > 1);
}

function extractTitle(contextBlock?: string): string {
  const match = contextBlock?.match(/Title:\s*(.+?)(?:\r?\n|$)/i);
  return match?.[1]?.trim() || 'Vi-HERMES';
}

async function loadDataset(): Promise<void> {
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Không tìm thấy dataset tại ${datasetPath}`);
  }

  const uniqueDocuments = new Map<string, RagDocument>();
  const loadedExamples: Array<Pick<ViHermesRecord, 'id' | 'question' | 'hop_level'>> = [];
  const loadedReferences = new Map<string, EvaluationReference>();
  const loadedFewShots: FewShotExample[] = [];
  const input = fs.createReadStream(datasetPath, { encoding: 'utf8' });
  const reader = readline.createInterface({ input, crlfDelay: Infinity });

  for await (const line of reader) {
    if (!line.trim()) continue;
    const record = JSON.parse(line) as ViHermesRecord;
    loadedExamples.push({ id: record.id, question: record.question, hop_level: record.hop_level });
    const title = extractTitle(record.context_block);
    const evidenceEntries = Object.entries(record.evidence || {}).filter(([, value]) => value?.trim());
    // Match the benchmark corpus construction: concatenate every evidence value
    // of one dataset record into a single global retrieval block.
    const evidenceBlock = evidenceEntries.map(([, content]) => content.trim()).join(' ').trim();
    const referenceEvidenceIds: string[] = [];
    if (evidenceBlock) {
      const blockId = crypto.createHash('sha1').update(evidenceBlock).digest('hex').slice(0, 16);
      referenceEvidenceIds.push(blockId);
      if (!uniqueDocuments.has(blockId)) {
        uniqueDocuments.set(blockId, {
          id: blockId,
          content: evidenceBlock,
          source: title,
          metadata: {
            dataset: 'Vi-HERMES',
            sample_id: record.id,
            evidence_count: evidenceEntries.length,
            hop_level: record.hop_level || 1,
          },
        });
      }
    }
    loadedReferences.set(normalizeText(record.question), {
      answer: record.answer,
      evidenceIds: [...new Set(referenceEvidenceIds)],
    });
    loadedFewShots.push({
      question: record.question,
      answer: record.answer,
      evidence: evidenceBlock,
    });
  }

  documents = [...uniqueDocuments.values()];
  examples = loadedExamples;
  // Few-shot protocol: reserve exactly two fixed ground-truth samples as
  // demonstrations and evaluate only the remaining 1,559 ViHERMES samples.
  // Use the final two records so the first HIV/AIDS sample exposed by the demo
  // remains an unseen evaluation query instead of leaking into the prompt.
  fewShotExamples = loadedFewShots.slice(-2);
  for (const demonstration of fewShotExamples) {
    loadedReferences.delete(normalizeText(demonstration.question));
  }
  evaluationReferences = loadedReferences;
  buildBm25Index();
}

function buildBm25Index(): void {
  // The document title carries critical legal/medical scope that short evidence
  // snippets often omit, so index both title and body (BM25F-style flattening).
  documentTokens = documents.map((doc) => tokenize(`${doc.source} ${doc.content}`));
  documentTermFrequency = documentTokens.map((tokens) => {
    const frequencies = new Map<string, number>();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) || 0) + 1);
    return frequencies;
  });
  documentFrequency = new Map();
  for (const tokens of documentTokens) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }
  averageDocumentLength =
    documentTokens.reduce((sum, tokens) => sum + tokens.length, 0) / Math.max(documentTokens.length, 1);
}

function retrieveBm25(query: string, limit: number): ScoredDocument[] {
  const queryTokens = tokenize(query);
  const uniqueQueryTokens = [...new Set(queryTokens)];
  const scores = documents.map((doc, index) => {
    const frequencies = documentTermFrequency[index];
    const length = documentTokens[index].length;
    let score = 0;
    for (const token of uniqueQueryTokens) {
      const frequency = frequencies.get(token) || 0;
      if (!frequency) continue;
      const containingDocuments = documentFrequency.get(token) || 0;
      const idf = Math.log(1 + (documents.length - containingDocuments + 0.5) / (containingDocuments + 0.5));
      const denominator = frequency + 1.5 * (1 - 0.75 + 0.75 * length / Math.max(averageDocumentLength, 1));
      score += idf * ((frequency * 2.5) / denominator);
    }
    return { doc, score, originalRank: index + 1 };
  });

  return scores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({ ...item, originalRank: index + 1 }));
}

function safeModelName(model: string): string {
  return model.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function embeddingCachePath(model: string): string {
  return path.join(cacheDir, `vihermes-${safeModelName(model)}.json`);
}

function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

async function jinaEmbed(
  texts: string[],
  model: string,
  kind: 'query' | 'document',
): Promise<number[][]> {
  if (!jinaApiKey) throw new Error('Thiếu JINA_API_KEY trên web server.');
  const response = await fetch(`${jinaApiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jinaApiKey}`,
    },
    body: JSON.stringify({
      model,
      task: kind === 'query' ? 'retrieval.query' : 'retrieval.passage',
      dimensions: Number(process.env.JINA_EMBED_DIMENSIONS || 1024),
      input: texts,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Jina embedding lỗi ${response.status}: ${details.slice(0, 300)}`);
  }
  const body = await response.json() as {
    data?: Array<{ index: number; embedding: number[] }>;
  };
  if (!body.data || body.data.length !== texts.length) {
    throw new Error('Jina trả về số lượng embedding không hợp lệ.');
  }
  return [...body.data]
    .sort((left, right) => left.index - right.index)
    .map((item) => normalizeVector(item.embedding));
}

async function loadEmbeddingCache(model: string): Promise<boolean> {
  const filePath = embeddingCachePath(model);
  if (!fs.existsSync(filePath)) return false;
  const cache = JSON.parse(await fs.promises.readFile(filePath, 'utf8')) as {
    datasetSize: number;
    model: string;
    inputFormat?: string;
    embeddings: number[][];
  };
  if (
    cache.datasetSize !== documents.length
    || cache.model !== model
    || cache.inputFormat !== embeddingInputFormat
    || cache.embeddings.length !== documents.length
  ) {
    return false;
  }
  denseEmbeddings = cache.embeddings;
  denseEmbeddingModel = model;
  return true;
}

async function buildDenseIndex(model: string): Promise<void> {
  if (denseEmbeddings && denseEmbeddingModel === model) return;
  if (await loadEmbeddingCache(model)) return;
  if (indexBuildPromise) return indexBuildPromise;

  indexBuildPromise = (async () => {
    fs.mkdirSync(cacheDir, { recursive: true });
    const embeddings: number[][] = [];
    const batchSize = Math.max(1, Number(process.env.EMBED_BATCH_SIZE || 32));
    for (let start = 0; start < documents.length; start += batchSize) {
      const batch = documents.slice(start, start + batchSize)
        .map((doc) => `${doc.source}\n${doc.content}`);
      embeddings.push(...await jinaEmbed(batch, model, 'document'));
      console.log(`[index] ${Math.min(start + batch.length, documents.length)}/${documents.length}`);
    }
    denseEmbeddings = embeddings;
    denseEmbeddingModel = model;
    const temporaryPath = `${embeddingCachePath(model)}.tmp`;
    await fs.promises.writeFile(temporaryPath, JSON.stringify({
      datasetSize: documents.length,
      model,
      inputFormat: embeddingInputFormat,
      embeddings,
    }));
    await fs.promises.rename(temporaryPath, embeddingCachePath(model));
  })().finally(() => {
    indexBuildPromise = null;
  });

  return indexBuildPromise;
}

function cosineSimilarity(left: number[], right: number[]): number {
  let score = 0;
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i += 1) score += left[i] * right[i];
  return score;
}

async function retrieveDense(query: string, model: string, limit: number): Promise<ScoredDocument[]> {
  await buildDenseIndex(model);
  const [queryEmbedding] = await jinaEmbed([query], model, 'query');
  return documents
    .map((doc, index) => ({
      doc,
      score: cosineSimilarity(queryEmbedding, denseEmbeddings![index]),
      originalRank: index + 1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({ ...item, originalRank: index + 1 }));
}

async function retrieve(query: string, method: RagMethod, model: string, limit: number): Promise<ScoredDocument[]> {
  if (method === 'bm25') return retrieveBm25(query, limit);
  if (method === 'dense') return retrieveDense(query, model, limit);

  const candidateLimit = Math.max(limit, 50);
  const [bm25, dense] = await Promise.all([
    Promise.resolve(retrieveBm25(query, candidateLimit)),
    retrieveDense(query, model, candidateLimit),
  ]);
  const fused = new Map<string, { doc: RagDocument; score: number; originalRank: number }>();
  // ViHERMES benchmark shows lexical retrieval is substantially stronger than
  // Nomic dense retrieval for Vietnamese legal-medical wording. Weighted RRF
  // preserves BM25 precision while still rewarding semantic consensus.
  const rankings = [
    { items: bm25, weight: 2 },
    { items: dense, weight: 1 },
  ];
  for (const [rankingIndex, ranking] of rankings.entries()) {
    ranking.items.forEach((item, rank) => {
      const current = fused.get(item.doc.id) || { doc: item.doc, score: 0, originalRank: item.originalRank };
      current.score += ranking.weight / (60 + rank + 1);
      if (rankingIndex === 0) current.originalRank = rank + 1;
      fused.set(item.doc.id, current);
    });
  }
  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

async function rerankDocuments(
  query: string,
  candidates: ScoredDocument[],
  topN: number,
): Promise<ScoredDocument[]> {
  if (!jinaApiKey) throw new Error('Thiếu JINA_API_KEY trên web server.');
  const result = await fetch(`${jinaApiBaseUrl}/rerank`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jinaApiKey}`,
    },
    body: JSON.stringify({
      model: defaultRerankerModel,
      query,
      documents: candidates.map((candidate) =>
        `${candidate.doc.source}\n${candidate.doc.content}`),
      top_n: topN,
      return_documents: false,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!result.ok) {
    throw new Error(`Jina reranker lỗi ${result.status}: ${(await result.text()).slice(0, 300)}`);
  }
  const body = await result.json() as {
    results?: Array<{ index: number; relevance_score: number }>;
  };
  if (!body.results?.length) throw new Error('Jina reranker không trả về kết quả.');
  return body.results.map((item) => {
    const candidate = candidates[item.index];
    if (!candidate) throw new Error('Kết quả reranker không khớp candidate pool.');
    return {
      ...candidate,
      score: item.relevance_score,
      retrievalScore: candidate.score,
      rerankScore: item.relevance_score,
    };
  });
}

function tokenF1(prediction: string, reference: string): number {
  const predictionTokens = tokenize(prediction.replace(/\[\d+\]/g, ''));
  const referenceTokens = tokenize(reference);
  if (!predictionTokens.length || !referenceTokens.length) return 0;
  const referenceCounts = new Map<string, number>();
  for (const token of referenceTokens) {
    referenceCounts.set(token, (referenceCounts.get(token) || 0) + 1);
  }
  let overlap = 0;
  for (const token of predictionTokens) {
    const remaining = referenceCounts.get(token) || 0;
    if (remaining > 0) {
      overlap += 1;
      referenceCounts.set(token, remaining - 1);
    }
  }
  const precision = overlap / predictionTokens.length;
  const recall = overlap / referenceTokens.length;
  return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
}

function conciseAnswer(value: string): string {
  const taggedAnswer = value.match(/<answer>([\s\S]*?)<\/answer>/i);
  return taggedAnswer?.[1]?.trim() || value;
}

async function evaluateQuery(
  question: string,
  answer: string,
  rankedHits: ScoredDocument[],
): Promise<{
  available: boolean;
  tokenF1: number | null;
  semanticSimilarity: number | null;
  semanticModel: string | null;
  recallAt5: number | null;
  mrr: number | null;
  relevantRetrieved: number;
  relevantTotal: number;
}> {
  const reference = evaluationReferences.get(normalizeText(question));
  if (!reference) {
    return {
      available: false,
      tokenF1: null,
      semanticSimilarity: null,
      semanticModel: null,
      recallAt5: null,
      mrr: null,
      relevantRetrieved: 0,
      relevantTotal: 0,
    };
  }
  const relevantIds = new Set(reference.evidenceIds);
  const topFive = rankedHits.slice(0, 5);
  const relevantRetrieved = new Set(
    topFive.filter((hit) => relevantIds.has(hit.doc.id)).map((hit) => hit.doc.id),
  ).size;
  const firstRelevantRank = rankedHits.findIndex((hit) => relevantIds.has(hit.doc.id));
  let semanticSimilarity: number | null = null;
  const evaluatedAnswer = conciseAnswer(answer);
  if (answer) {
    try {
      const [predictionEmbedding, referenceEmbedding] = await jinaEmbed(
        [evaluatedAnswer, reference.answer],
        evaluationEmbeddingModel,
        'query',
      );
      semanticSimilarity = cosineSimilarity(predictionEmbedding, referenceEmbedding);
    } catch (error) {
      console.warn(`[evaluation] semantic similarity unavailable: ${String(error)}`);
    }
  }
  return {
    available: true,
    tokenF1: answer ? tokenF1(evaluatedAnswer, reference.answer) : null,
    semanticSimilarity,
    semanticModel: semanticSimilarity === null ? null : evaluationEmbeddingModel,
    recallAt5: relevantIds.size ? relevantRetrieved / relevantIds.size : null,
    mrr: firstRelevantRank >= 0 ? 1 / (firstRelevantRank + 1) : 0,
    relevantRetrieved,
    relevantTotal: relevantIds.size,
  };
}

function createPrompt(
  question: string,
  hits: ScoredDocument[],
  preset: PromptPreset,
  customTemplate: string,
): string {
  const context = hits.map((hit, index) =>
    `[${index + 1}] Nguồn: ${hit.doc.source}\n${hit.doc.content}`,
  ).join('\n\n');
  const template = preset === 'custom' ? customTemplate.trim() : PROMPT_PRESETS[preset].template;
  if (!template) throw new Error('Custom prompt không được để trống.');
  if (!template.includes('{{context}}') || !template.includes('{{question}}')) {
    throw new Error('Custom prompt phải chứa cả {{context}} và {{question}}.');
  }
  const demonstrations = fewShotExamples
    .map((example, index) =>
      `VÍ DỤ ${index + 1}\nNgữ cảnh: ${example.evidence}\nCâu hỏi: ${example.question}\nTrả lời: ${example.answer}`,
    )
    .join('\n\n');
  return template
    .replaceAll('{{context}}', context)
    .replaceAll('{{question}}', question)
    .replaceAll('{{examples}}', demonstrations);
}

async function generateAnswer(
  prompt: string,
  model: string,
  temperature: number,
): Promise<{ answer: string; promptTokens: number; outputTokens: number }> {
  if (!geminiApiKey) throw new Error('Thiếu GEMINI_API_KEY trên web server.');
  const response = await fetch(
    `${geminiApiBaseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini generation lỗi ${response.status}: ${details.slice(0, 300)}`);
  }
  const body = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  return {
    answer: body.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || '',
    promptTokens: body.usageMetadata?.promptTokenCount || 0,
    outputTokens: body.usageMetadata?.candidatesTokenCount || 0,
  };
}

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    dataset: {
      path: datasetPath,
      documents: documents.length,
      examples: examples.length,
      evaluationExamples: evaluationReferences.size,
      fewShotExamples: fewShotExamples.length,
    },
    providers: {
      generation: {
        name: 'Gemini',
        configured: Boolean(geminiApiKey),
        model: defaultLlmModel,
      },
      retrieval: {
        name: 'Jina AI',
        configured: Boolean(jinaApiKey),
        model: defaultEmbeddingModel,
      },
      reranker: {
        name: 'Jina AI',
        configured: Boolean(jinaApiKey),
        model: defaultRerankerModel,
      },
    },
    denseIndex: {
      ready: Boolean(denseEmbeddings),
      model: denseEmbeddingModel,
      building: Boolean(indexBuildPromise),
    },
  });
});

app.get('/api/examples', (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit || 8), 1), 50);
  response.json({ examples: examples.slice(0, limit) });
});

app.post('/api/index/build', async (request, response, next) => {
  try {
    const model = String(request.body?.embeddingModel || defaultEmbeddingModel);
    await buildDenseIndex(model);
    response.json({ ready: true, model, documents: documents.length });
  } catch (error) {
    next(error);
  }
});

app.post('/api/rag/query', async (request, response, next) => {
  try {
    const question = String(request.body?.question || '').trim();
    if (!question) return response.status(400).json({ error: 'Câu hỏi không được để trống.' });
    const requestedMethod = String(request.body?.method || 'bm25') as RagMethod;
    if (!['bm25', 'dense', 'hybrid'].includes(requestedMethod)) {
      return response.status(400).json({ error: `Phương pháp không hợp lệ: ${requestedMethod}` });
    }
    const topK = Math.min(Math.max(Number(request.body?.topK || 5), 1), 20);
    const embeddingModel = String(request.body?.embeddingModel || defaultEmbeddingModel);
    const llmModel = String(request.body?.llmModel || defaultLlmModel);
    const evaluationDepth = Math.max(topK, 5);
    const promptPreset = String(request.body?.promptPreset || 'zero-shot') as PromptPreset;
    if (!['zero-shot', 'few-shot', 'cot', 'custom'].includes(promptPreset)) {
      return response.status(400).json({ error: `Prompt preset không hợp lệ: ${promptPreset}` });
    }
    const customPromptTemplate = String(request.body?.customPromptTemplate || '').slice(0, 12_000);
    const temperature = Math.min(Math.max(Number(request.body?.temperature ?? 0.1), 0), 2);
    const shouldGenerate = request.body?.generate !== false;
    const rerankerMode = String(request.body?.reranker || 'none') as RerankerMode;
    if (!['none', 'jina-reranker-v2'].includes(rerankerMode)) {
      return response.status(400).json({ error: `Reranker không hợp lệ: ${rerankerMode}` });
    }
    const totalStart = performance.now();
    const retrievalStart = performance.now();
    const candidateDepth = rerankerMode === 'jina-reranker-v2' ? 20 : evaluationDepth;
    const candidates = await retrieve(
      question,
      requestedMethod,
      embeddingModel,
      candidateDepth,
    );
    const retrievalTime = performance.now() - retrievalStart;
    const rerankStart = performance.now();
    const rankedHits = rerankerMode === 'jina-reranker-v2'
      ? await rerankDocuments(question, candidates, Math.max(topK, 5))
      : candidates;
    const rerankTime = performance.now() - rerankStart;
    const hits = rankedHits.slice(0, topK);
    const prompt = createPrompt(question, hits, promptPreset, customPromptTemplate);
    const generationStart = performance.now();
    const generated = shouldGenerate
      ? await generateAnswer(prompt, llmModel, temperature)
      : { answer: '', promptTokens: 0, outputTokens: 0 };
    const displayedAnswer =
      promptPreset === 'cot' ? conciseAnswer(generated.answer) : generated.answer;
    const generationTime = performance.now() - generationStart;
    // Ground truth is used only after retrieval/generation and never enters the prompt or index.
    const evaluationStart = performance.now();
    const evaluation = await evaluateQuery(question, generated.answer, rankedHits);
    const evaluationTime = performance.now() - evaluationStart;

    response.json({
      answer: displayedAnswer,
      method: requestedMethod,
      reranker: rerankerMode,
      models: { llm: llmModel, embedding: embeddingModel },
      promptPreset,
      evaluation,
      retrieval: hits.map((hit, index) => ({
        id: hit.doc.id,
        score: hit.score,
        content: hit.doc.content,
        source: hit.doc.source,
        metadata: hit.doc.metadata,
        rank: index + 1,
        originalRank: hit.originalRank,
        retrievalScore: hit.retrievalScore,
        rerankScore: hit.rerankScore,
      })),
      prompt,
      metrics: {
        latency: Math.round(performance.now() - totalStart),
        retrievalTime: Math.round(retrievalTime),
        rerankTime: Math.round(rerankTime),
        generationTime: Math.round(generationTime),
        evaluationTime: Math.round(evaluationTime),
        tokensUsed: generated.promptTokens + generated.outputTokens,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: error.message || 'Lỗi máy chủ không xác định.' });
});

// Memoized so cold starts on Vercel (and repeated CLI invocations locally) only pay the
// dataset-parsing cost once per warm process instead of once per request.
let readyPromise: Promise<void> | null = null;
export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = loadDataset().then(() => loadEmbeddingCache(defaultEmbeddingModel)).then(() => undefined);
  }
  return readyPromise;
}

export const internals = {
  buildDenseIndex,
  retrieveBm25,
  getExamples: () => examples,
  getDocuments: () => documents,
  getEvaluationReferences: () => evaluationReferences,
  getFewShotExamples: () => fewShotExamples,
  defaultEmbeddingModel,
  defaultLlmModel,
};

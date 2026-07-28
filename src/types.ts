/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export interface RetrievalResult {
  id: string;
  score: number;
  retrievalScore?: number;
  rerankScore?: number;
  content: string;
  source: string;
  metadata: Record<string, any>;
  date?: string;
}

export interface Metrics {
  latency: number;
  tokensUsed: number;
  retrievalTime: number;
  rerankTime: number;
  generationTime: number;
  evaluationTime: number;
  evaluationAvailable: boolean;
  tokenF1: number | null;
  semanticSimilarity: number | null;
  semanticModel: string | null;
  recallAt5: number | null;
  mrr: number | null;
  relevantRetrieved: number;
  relevantTotal: number;
}

export type DebugTab = 'retrieval' | 'prompt' | 'metrics';
export type Page = 'chat' | 'metrics';

export interface ModelConfig {
  embedding: string;
  llm: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  showDebugPanel: boolean;
  topK: number;
  ragMethod: 'bm25' | 'dense' | 'hybrid';
  reranker: 'none' | 'jina-reranker-v2';
  promptPreset: 'zero-shot' | 'few-shot' | 'cot' | 'custom';
  customPromptTemplate: string;
  temperature: number;
}

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
  content: string;
  source: string;
  metadata: Record<string, any>;
  date?: string;
}

export interface RerankResult {
  id: string;
  originalRank: number;
  newRank: number;
  score: number;
  content: string;
}

export interface Metrics {
  latency: number;
  tokensUsed: number;
  retrievalTime: number;
  rerankTime: number;
}

export type DebugTab = 'retrieval' | 'rerank' | 'prompt' | 'metrics';
export type Page = 'chat' | 'reranking' | 'datasets' | 'metrics' | 'models' | 'settings';

export interface ModelConfig {
  embedding: string;
  reranker: string;
  llm: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  showDebugPanel: boolean;
  enableCompareMode: boolean;
  topK: number;
  ollamaBaseUrl: string;
  ollamaModel: string;
  llmProvider: 'ollama' | 'gemini';
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  docCount: number;
  lastIndexed: Date;
}

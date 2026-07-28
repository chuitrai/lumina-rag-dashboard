/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Page, ModelConfig, AppSettings, RetrievalResult, RerankResult, Metrics } from '../types';
import { SAMPLE_QAS } from '../data/mockData';

interface AppContextType {
  activePage: Page;
  setActivePage: (page: Page) => void;
  config: ModelConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  activeRetrieval: RetrievalResult[];
  setActiveRetrieval: (res: RetrievalResult[]) => void;
  activeRerank: RerankResult[];
  setActiveRerank: (res: RerankResult[]) => void;
  activePrompt: string;
  setActivePrompt: (prompt: string) => void;
  activeMetrics: Metrics;
  setActiveMetrics: (metrics: Metrics) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activePage, setActivePage] = useState<Page>('chat');
  const [config, setConfig] = useState<ModelConfig>({
    embedding: 'bge',
    reranker: 'bge-large',
    llm: 'llama3.2:1b',
  });
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    showDebugPanel: true,
    enableCompareMode: false,
    topK: 5,
    ollamaBaseUrl: (process.env.OLLAMA_BASE_URL as string) || 'http://localhost:11434',
    ollamaModel: (process.env.OLLAMA_MODEL as string) || 'llama3.2:1b',
    llmProvider: 'ollama',
  });
  const [systemPrompt, setSystemPrompt] = useState<string>(`You are a helpful assistant. Use the following context to answer the user's question.

Context:
{context}

Question:
{query}

Answer:`);

  // Active state representing current RAG query
  const [activeRetrieval, setActiveRetrieval] = useState<RetrievalResult[]>(SAMPLE_QAS[0].retrieval);
  const [activeRerank, setActiveRerank] = useState<RerankResult[]>(SAMPLE_QAS[0].rerank);
  const [activePrompt, setActivePrompt] = useState<string>(SAMPLE_QAS[0].prompt);
  const [activeMetrics, setActiveMetrics] = useState<Metrics>(SAMPLE_QAS[0].metrics);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  return (
    <AppContext.Provider 
      value={{ 
        activePage, 
        setActivePage, 
        config, 
        setConfig, 
        settings, 
        setSettings,
        systemPrompt,
        setSystemPrompt,
        activeRetrieval,
        setActiveRetrieval,
        activeRerank,
        setActiveRerank,
        activePrompt,
        setActivePrompt,
        activeMetrics,
        setActiveMetrics
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

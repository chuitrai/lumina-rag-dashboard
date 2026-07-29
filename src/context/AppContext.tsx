import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppSettings, Metrics, ModelConfig, Page, RetrievalResult } from '../types';

interface AppContextType {
  activePage: Page;
  setActivePage: (page: Page) => void;
  config: ModelConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  activeRetrieval: RetrievalResult[];
  setActiveRetrieval: (results: RetrievalResult[]) => void;
  activePrompt: string;
  setActivePrompt: (prompt: string) => void;
  activeMetrics: Metrics;
  setActiveMetrics: (metrics: Metrics) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activePage, setActivePage] = useState<Page>('chat');
  const [config, setConfig] = useState<ModelConfig>({
    embedding: 'jina-embeddings-v3',
    llm: 'gemini-flash-latest',
  });
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    showDebugPanel: true,
    topK: 5,
    ragMethod: 'bm25',
    reranker: 'none',
    promptPreset: 'zero-shot',
    customPromptTemplate: '',
    temperature: 0.1,
  });
  const [activeRetrieval, setActiveRetrieval] = useState<RetrievalResult[]>([]);
  const [activePrompt, setActivePrompt] = useState('');
  const [activeMetrics, setActiveMetrics] = useState<Metrics>({
    latency: 0,
    tokensUsed: 0,
    retrievalTime: 0,
    rerankTime: 0,
    generationTime: 0,
    evaluationTime: 0,
    evaluationAvailable: false,
    tokenF1: null,
    semanticSimilarity: null,
    semanticModel: null,
    recallAt5: null,
    mrr: null,
    relevantRetrieved: 0,
    relevantTotal: 0,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  return (
    <AppContext.Provider value={{
      activePage,
      setActivePage,
      config,
      setConfig,
      settings,
      setSettings,
      activeRetrieval,
      setActiveRetrieval,
      activePrompt,
      setActivePrompt,
      activeMetrics,
      setActiveMetrics,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}

import { useCallback, useState } from 'react';
import ChatContainer from '../components/ChatContainer';
import { Message, RetrievalResult } from '../types';
import { useApp } from '../context/AppContext';

interface RagApiResponse {
  answer: string;
  prompt: string;
  retrieval: Array<RetrievalResult & { rank: number; originalRank: number }>;
  metrics: {
    latency: number;
    tokensUsed: number;
    retrievalTime: number;
    rerankTime: number;
    generationTime: number;
    evaluationTime: number;
  };
  evaluation: {
    available: boolean;
    tokenF1: number | null;
    semanticSimilarity: number | null;
    semanticModel: string | null;
    recallAt5: number | null;
    mrr: number | null;
    relevantRetrieved: number;
    relevantTotal: number;
  };
  error?: string;
}

const WELCOME_MESSAGE = `Chào mừng bạn đến với **ViHERMES RAG**.

Hệ thống truy xuất trên toàn bộ evidence của bộ dữ liệu Vi-HERMES và sinh câu trả lời bằng **Ollama local** (mặc định \`llama3.2:1b\`, không cần API key). Bạn có thể chọn **BM25**, **Dense Vector** hoặc **Hybrid**, bật/tắt reranker và so sánh các kiểu prompting ngay trên web.`;

export default function ChatPage() {
  const {
    setActiveRetrieval,
    setActivePrompt,
    setActiveMetrics,
    settings,
    config,
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: WELCOME_MESSAGE,
    timestamp: new Date(),
  }]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    const requestId = Date.now();
    const userMessage: Message = {
      id: `user-${requestId}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    const assistantId = `assistant-${requestId}`;
    setMessages((current) => [...current, userMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: content,
          method: settings.ragMethod,
          reranker: settings.reranker,
          topK: settings.topK,
          embeddingModel: config.embedding,
          llmModel: config.llm,
          promptPreset: settings.promptPreset,
          customPromptTemplate: settings.customPromptTemplate,
          temperature: settings.temperature,
        }),
      });
      const result = await response.json() as RagApiResponse;
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);

      const retrieval: RetrievalResult[] = result.retrieval.map((hit) => ({
        id: hit.id,
        score: hit.score,
        content: hit.content,
        source: hit.source,
        metadata: hit.metadata,
        retrievalScore: hit.retrievalScore,
        rerankScore: hit.rerankScore,
      }));
      setActiveRetrieval(retrieval);
      setActivePrompt(result.prompt);
      setActiveMetrics({
        ...result.metrics,
        evaluationAvailable: result.evaluation.available,
        tokenF1: result.evaluation.tokenF1,
        semanticSimilarity: result.evaluation.semanticSimilarity,
        semanticModel: result.evaluation.semanticModel,
        recallAt5: result.evaluation.recallAt5,
        mrr: result.evaluation.mrr,
        relevantRetrieved: result.evaluation.relevantRetrieved,
        relevantTotal: result.evaluation.relevantTotal,
      });
      setMessages((current) => [...current, {
        id: assistantId,
        role: 'assistant',
        content: result.answer || 'LLM API không trả về nội dung.',
        timestamp: new Date(),
      }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setMessages((current) => [...current, {
        id: assistantId,
        role: 'assistant',
        content: `Không thể hoàn tất truy vấn RAG.\n\n**Chi tiết:** ${message}\n\nHãy kiểm tra: Ollama đang chạy tại đúng OLLAMA_BASE_URL, model đã được \`ollama pull\`, và (nếu dùng Dense/Hybrid hoặc Reranker) JINA_API_KEY đã cấu hình trên web server.`,
        timestamp: new Date(),
      }]);
      setActiveMetrics({
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
    } finally {
      setIsStreaming(false);
    }
  }, [
    config.embedding,
    config.llm,
    settings.customPromptTemplate,
    settings.promptPreset,
    settings.ragMethod,
    settings.reranker,
    settings.temperature,
    settings.topK,
    setActiveMetrics,
    setActivePrompt,
    setActiveRetrieval,
  ]);

  return (
    <div className="h-full">
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        onRetry={(id) => {
          const index = messages.findIndex((message) => message.id === id);
          const previous = messages[index - 1];
          if (previous?.role === 'user') handleSendMessage(previous.content);
        }}
        isStreaming={isStreaming}
      />
    </div>
  );
}

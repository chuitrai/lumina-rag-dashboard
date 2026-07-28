/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import ChatContainer from '../components/ChatContainer';
import { Message, RetrievalResult, RerankResult } from '../types';
import { useApp } from '../context/AppContext';
import { OllamaProvider, GeminiProvider } from '../services/llm';
import { getRagIndex } from '../services/retrieval';
import ragDb from '../data/rag_database.json';

export default function ChatPage() {
  const { 
    setActiveRetrieval, 
    setActiveRerank, 
    setActivePrompt, 
    setActiveMetrics,
    settings,
    config,
    systemPrompt
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Chào mừng bạn đến với VIMEDRAG. Tôi đã đồng bộ các tài liệu y khoa từ tệp rag_database.json. Bạn hãy nhập câu hỏi bất kỳ để tôi thực hiện quy trình tra cứu Med-RAG và hiển thị thông tin chi tiết.',
      timestamp: new Date()
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const startRAGTime = Date.now();
    const cleanQuery = content.trim().toLowerCase();
    
    // Define greeting patterns
    const greetingKeywords = ['chào', 'hello', 'hi', 'hey', 'bạn là ai', 'who are you', 'help', 'trợ giúp', 'giới thiệu', 'greetings', 'xin chao', 'chao ban'];
    const isGreeting = greetingKeywords.some(keyword => cleanQuery === keyword || cleanQuery.startsWith(keyword + ' ') || cleanQuery.endsWith(' ' + keyword));

    if (isGreeting) {
      const responseText = `Xin chào! Tôi là **VIMEDRAG** — Trợ lý AI phân tích lâm sàng và kiểm thử quy trình Med-RAG. 🩺💡

Tôi đã được nạp dữ liệu đầy đủ từ tệp cơ sở dữ liệu \`rag_database.json\`. Bạn có thể đặt các câu hỏi thực tế hoặc kiểm tra mô phỏng RAG với các chủ đề sau:

1. **Chương trình chuyển đổi số HIV/AIDS 2025-2030**:
   - *Ví dụ:* "Những loại bệnh án nào cần được hoàn thiện?" hoặc "Tiêu chuẩn quốc tế HL7 FHIR được áp dụng thế nào?"

2. **Kế hoạch đấu thầu & Cung ứng thuốc**:
   - *Ví dụ:* "Báo giá thuốc biệt dược gốc có hiệu lực đến khi nào?" hoặc "Mục tiêu cắt giảm chi phí của phương thức đàm phán thầu giá trực tiếp quốc tế với biệt dược tim mạch là bao nhiêu?"

3. **Hồ sơ xác nhận quảng cáo (7WEALTH - BOSWELLIA)**:
   - *Ví dụ:* "Đơn vị nào chịu trách nhiệm quảng cáo cho sản phẩm BOSWELLIA?" hoặc "Mã hồ sơ 2500319-0054 thuộc về công ty nào?"

4. **Phác đồ điều trị & Khuyến cáo lâm sàng mới nhất (2026)**:
   - *Ví dụ:* "Phác đồ điều trị suy tim cấp độ III/IV năm 2026 đề xuất kết hợp những loại thuốc nào?" hoặc "Chỉ số xét nghiệm NT-proBNP được khuyến cáo đo định kỳ ra sao?"

Hãy nhập bất kỳ câu hỏi hoặc từ khóa nào phía trên để tôi thực hiện quy trình **Truy xuất (Retrieval)**, **Xếp hạng lại (Rerank)**, **Tái cấu trúc Prompt** và hiển thị đầy đủ thông số hiệu năng RAG nhé!`;

      // Reset RAG Debugging states
      setActiveRetrieval([]);
      setActiveRerank([]);
      setActivePrompt('[HỆ THỐNG] Đang chờ câu hỏi chuyên sâu để khởi tạo Prompt RAG...');
      setActiveMetrics({
        latency: 0,
        tokensUsed: 0,
        retrievalTime: 0,
        rerankTime: 0
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsStreaming(false);
      return;
    }

    // Step 1: Retrieval — TF-IDF + cosine similarity over the local RAG corpus (see
    // services/retrieval.ts). This replaces the old keyword-overlap heuristic, which matched
    // substrings without word boundaries and collapsed "đồng"/"động" into the same token after
    // stripping Vietnamese tones, causing frequent wrong-document hits.
    const startRetrievalTime = Date.now();
    const index = getRagIndex(ragDb.documents as any);
    const topDocs = index.search(content, settings.topK || 5);
    const retrievalTime = Date.now() - startRetrievalTime;

    const retrieval: RetrievalResult[] = topDocs.map(({ doc, score }) => ({
      id: doc.id,
      score,
      source: doc.source,
      content: doc.content,
      date: doc.date ?? undefined,
      metadata: doc.metadata
    }));

    // No separate reranking model is wired up — the debug "Rerank" tab shows the same
    // TF-IDF-ordered list, kept as its own step so the UI/metrics shape stays consistent.
    const startRerankTime = Date.now();
    const rerank: RerankResult[] = topDocs.map(({ doc, score }, rank) => ({
      id: doc.id,
      originalRank: rank + 1,
      newRank: rank + 1,
      score,
      content: doc.content
    }));
    const rerankTime = Date.now() - startRerankTime;

    const contextString = retrieval.length > 0
      ? rerank.map(r => `- ${r.content}`).join('\n')
      : '(Không tìm thấy tài liệu phù hợp trong cơ sở dữ liệu.)';
    const formattedPrompt = systemPrompt
      .replace('{context}', contextString)
      .replace('{query}', content);

    // Prepare assistant response container in messages
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMsg]);

    // Choose Provider: Ollama vs. Gemini
    const provider = settings.llmProvider === 'ollama'
      ? new OllamaProvider(settings.ollamaBaseUrl, settings.ollamaModel)
      : new GeminiProvider(undefined, config.llm);

    let accumulatedText = '';
    
    try {
      await provider.streamGenerate(
        formattedPrompt,
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(m => {
            if (m.id === assistantMsgId) {
              return { ...m, content: accumulatedText };
            }
            return m;
          }));
        },
        { model: config.llm }
      );

      // Successfully generated: calculate dynamic metrics
      const totalTime = Date.now() - startRAGTime;
      const latency = totalTime;
      const tokensUsed = Math.round(accumulatedText.split(/\s+/).length * 1.3 + formattedPrompt.split(/\s+/).length * 1.3);

      setActiveRetrieval(retrieval);
      setActiveRerank(rerank);
      setActivePrompt(formattedPrompt);
      setActiveMetrics({
        latency,
        tokensUsed,
        retrievalTime,
        rerankTime
      });
    } catch (err: any) {
      console.error('LLM error:', err);
      const errorText = `Lỗi kết nối tới Ollama API (${settings.ollamaBaseUrl}).\n\n**Hướng dẫn khắc phục:**\n1. Đảm bảo ứng dụng Ollama đang chạy trên máy local của bạn.\n2. Cần khởi chạy Ollama có bật CORS bằng lệnh:\n   \`\`\`bash\n   # macOS/Linux\n   OLLAMA_ORIGINS="*" ollama serve\n   # Windows\n   set OLLAMA_ORIGINS=*\n   ollama serve\n   \`\`\`\n3. Đảm bảo bạn đã tải mô hình tương ứng về máy local:\n   \`\`\`bash\n   ollama pull ${settings.ollamaModel}\n   \`\`\`\n4. Kiểm tra và cập nhật cài đặt địa chỉ/mô hình Ollama trong mục Settings nếu cần.`;
      
      setMessages(prev => prev.map(m => {
        if (m.id === assistantMsgId) {
          return { ...m, content: errorText };
        }
        return m;
      }));

      setActiveRetrieval([]);
      setActiveRerank([]);
      setActivePrompt(formattedPrompt);
      setActiveMetrics({
        latency: 0,
        tokensUsed: 0,
        retrievalTime: 0,
        rerankTime: 0
      });
    } finally {
      setIsStreaming(false);
    }
  }, [setActiveRetrieval, setActiveRerank, setActivePrompt, setActiveMetrics, settings, config, systemPrompt]);

  return (
    <div className="h-full">
      <ChatContainer 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        onRetry={(id) => {
          const index = messages.findIndex(m => m.id === id);
          if (index > 0 && messages[index-1].role === 'user') {
            handleSendMessage(messages[index-1].content);
          } else {
            handleSendMessage("Hãy đánh giá lại bối cảnh chuyển đổi số HIV/AIDS.");
          }
        }}
        isStreaming={isStreaming} 
      />
    </div>
  );
}

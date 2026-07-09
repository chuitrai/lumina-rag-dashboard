/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import ChatContainer from '../components/ChatContainer';
import { Message, RetrievalResult, RerankResult } from '../types';
import { useApp } from '../context/AppContext';
import { SAMPLE_QAS } from '../data/mockData';
import { OllamaProvider, GeminiProvider } from '../services/llm';
import ragDb from '../data/rag_database.json';

function removeVietnameseTones(str: string): string {
  let res = str;
  res = res.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  res = res.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  res = res.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  res = res.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  res = res.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  res = res.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  res = res.replace(/đ/g, "d");
  res = res.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  res = res.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  res = res.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  res = res.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  res = res.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  res = res.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  res = res.replace(/Đ/g, "D");
  res = res.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  res = res.replace(/\u02C6|\u0306|\u031B/g, "");
  return res;
}

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

    // Step 1: Retrieval & Reranking Step
    let retrieval: RetrievalResult[] = [];
    let rerank: RerankResult[] = [];
    let formattedPrompt = '';
    
    const startRetrievalTime = Date.now();
    
    // Check if we can find a preset matching question to use its custom structured metadata
    let bestMatch: typeof SAMPLE_QAS[0] | null = null;
    let highestScore = 0;

    const normalizeText = (text: string) => {
      return removeVietnameseTones(text.toLowerCase())
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, " ")
        .trim();
    };

    const normQuery = normalizeText(cleanQuery);
    const qWords = normQuery.split(/\s+/).filter(w => w.length > 1);

    if (qWords.length > 0) {
      SAMPLE_QAS.forEach(qa => {
        const normTarget = normalizeText(qa.question);
        const tWords = normTarget.split(/\s+/).filter(w => w.length > 1);

        let matchCount = 0;
        qWords.forEach(word => {
          if (tWords.includes(word)) {
            matchCount++;
          }
        });

        let score = matchCount;
        if (normTarget.includes(normQuery)) {
          score += 15;
        } else if (normQuery.includes(normTarget)) {
          score += 10;
        }

        let consecutiveMatches = 0;
        let currentConsecutive = 0;
        qWords.forEach((word) => {
          if (tWords.includes(word)) {
            currentConsecutive++;
            if (currentConsecutive > consecutiveMatches) {
              consecutiveMatches = currentConsecutive;
            }
          } else {
            currentConsecutive = 0;
          }
        });
        score += consecutiveMatches * 2;

        const unionSize = new Set([...qWords, ...tWords]).size;
        const jaccard = unionSize > 0 ? (matchCount / unionSize) : 0;
        score += jaccard * 5;

        if (score > highestScore) {
          highestScore = score;
          bestMatch = qa;
        }
      });
    }

    let retrievalTime = 0;
    let rerankTime = 0;

    if (bestMatch && highestScore > 0.8) {
      retrieval = bestMatch.retrieval;
      rerank = bestMatch.rerank;
      retrievalTime = bestMatch.metrics.retrievalTime;
      rerankTime = bestMatch.metrics.rerankTime;
      formattedPrompt = bestMatch.prompt;
    } else {
      // Dynamic fallback retrieval from local rag_database.json
      const queryWords = normalizeText(cleanQuery).split(/\s+/).filter(w => w.length > 1);
      const scoredDocs = ragDb.documents.map(doc => {
        const docContentNorm = normalizeText(doc.content);
        let matchCount = 0;
        queryWords.forEach(word => {
          if (docContentNorm.includes(word)) {
            matchCount++;
          }
        });
        const score = queryWords.length > 0 ? (matchCount / queryWords.length) : 0;
        return { doc, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, settings.topK || 5);

      retrievalTime = Date.now() - startRetrievalTime;
      
      const startRerankTime = Date.now();
      retrieval = scoredDocs.map((item) => ({
        id: item.doc.id,
        score: item.score,
        source: item.doc.source,
        content: item.doc.content,
        date: item.doc.date,
        metadata: item.doc.metadata
      }));

      rerank = scoredDocs.map((item, index) => ({
        id: item.doc.id,
        originalRank: index + 1,
        newRank: index + 1,
        score: Math.min(item.score * 1.1, 1.0),
        content: item.doc.content
      }));
      rerankTime = Date.now() - startRerankTime;

      const contextString = rerank.map(r => `- ${r.content}`).join('\n');
      formattedPrompt = systemPrompt
        .replace('{context}', contextString)
        .replace('{query}', content);
    }

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
      const errorText = `Lỗi kết nối tới Ollama API (${settings.ollamaBaseUrl}).\n\n**Hướng dẫn khắc phục:**\n1. Đảm bảo ứng dụng Ollama đang chạy trên máy local của bạn.\n2. Cần khởi chạy Ollama có bật CORS bằng lệnh:\n   \`\`\`bash\n   # macOS/Linux\n   OLLAMA_ORIGINS="*" ollama serve\n   # Windows\n   set OLLAMA_ORIGINS=*\n   ollama serve\n   \`\`\`\n3. Đảm bảo bạn đã tải mô hình tương ứng về máy local:\n   \`\`\`bash\n   ollama pull qwen3:8b\n   \`\`\`\n4. Kiểm tra và cập nhật cài đặt địa chỉ/mô hình Ollama trong mục Settings nếu cần.`;
      
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

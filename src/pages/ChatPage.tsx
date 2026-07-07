/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import ChatContainer from '../components/ChatContainer';
import { Message } from '../types';
import { useApp } from '../context/AppContext';
import { SAMPLE_QAS } from '../data/mockData';

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
    setActiveMetrics 
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

  const handleSendMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);

    setIsStreaming(true);

    setTimeout(() => {
      // Robust matcher to search for matched sample QA based on keywords overlap
      const cleanQuery = content.trim().toLowerCase();
      
      // Define greeting patterns
      const greetingKeywords = ['chào', 'hello', 'hi', 'hey', 'bạn là ai', 'who are you', 'help', 'trợ giúp', 'giới thiệu', 'greetings', 'xin chao', 'chao ban'];
      const isGreeting = greetingKeywords.some(keyword => cleanQuery === keyword || cleanQuery.startsWith(keyword + ' ') || cleanQuery.endsWith(' ' + keyword));

      let responseText = '';
      if (isGreeting) {
        responseText = `Xin chào! Tôi là **VIMEDRAG** — Trợ lý AI phân tích lâm sàng và kiểm thử quy trình Med-RAG. 🩺💡

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
        
        // Reset RAG Debugging states to a clean, fresh state for greetings
        setActiveRetrieval([]);
        setActiveRerank([]);
        setActivePrompt('[HỆ THỐNG] Đang chờ câu hỏi chuyên sâu để khởi tạo Prompt RAG...');
        setActiveMetrics({
          latency: 0,
          tokensUsed: 0,
          retrievalTime: 0,
          rerankTime: 0
        });
      } else {
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

            // 1. Keyword Overlap Count
            let matchCount = 0;
            qWords.forEach(word => {
              if (tWords.includes(word)) {
                matchCount++;
              }
            });

            // 2. Score Calculation
            let score = matchCount;

            // Substring bonus
            if (normTarget.includes(normQuery)) {
              score += 15;
            } else if (normQuery.includes(normTarget)) {
              score += 10;
            }

            // Word sequence/consecutive matches boost
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

            // Tie breaker with Jaccard
            const unionSize = new Set([...qWords, ...tWords]).size;
            const jaccard = unionSize > 0 ? (matchCount / unionSize) : 0;
            score += jaccard * 5;

            if (score > highestScore) {
              highestScore = score;
              bestMatch = qa;
            }
          });
        }

        // Require at least a very basic threshold of positive overlap
        if (bestMatch && highestScore > 0.8) {
          responseText = bestMatch.answer;
          // Dynamically update RAG Debugging states
          setActiveRetrieval(bestMatch.retrieval);
          setActiveRerank(bestMatch.rerank);
          setActivePrompt(bestMatch.prompt);
          setActiveMetrics(bestMatch.metrics);
        } else {
          responseText = 'Tôi không tìm thấy tài liệu lâm sàng chính xác tương ứng trong tệp cơ sở dữ liệu `rag_database.json`. Xin vui lòng mở rộng từ khóa tìm kiếm hoặc tự cập nhật các văn bản mong muốn của bạn vào file `/src/data/rag_database.json`.';
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(false);
    }, 1500);
  }, [setActiveRetrieval, setActiveRerank, setActivePrompt, setActiveMetrics]);

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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import DebugPanel from './components/DebugPanel';
import ChatPage from './pages/ChatPage';
import RerankPage from './pages/RerankPage';
import DatasetsPage from './pages/DatasetsPage';
import MetricsPage from './pages/MetricsPage';
import SettingsPage from './pages/SettingsPage';
import { RetrievalResult, RerankResult, Metrics } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Zap, Info, Lock } from 'lucide-react';

const MOCK_RETRIEVAL: RetrievalResult[] = [
  {
    id: 'doc_1',
    score: 0.9183,
    source: 'Nghi_dinh_117_2020_ND_CP.pdf',
    content: 'Theo Điều 15 Nghị định 117/2020/NĐ-CP của Chính phủ về xử phạt vi phạm hành chính trong lĩnh vực y tế, mức phạt đối với hành vi quảng cáo dịch vụ khám bệnh, chữa bệnh quá phạm vi chuyên môn được ghi trong giấy phép hoạt động là từ 30.000.000 đồng đến 40.000.000 đồng đối với cá nhân, và phạt gấp đôi đối với tổ chức.',
    metadata: { dieu: 15, chu_de: 'XuPatHanhChinh', loai_tai_lieu: 'NghiDinh' }
  },
  {
    id: 'doc_2',
    score: 0.8872,
    source: 'Luat_Kham_Benh_Chua_Benh_2023.pdf',
    content: 'Điều 22 quy định về điều kiện cấp giấy phép hành nghề y khoa tại Việt Nam: Người nộp đơn phải hoàn thành chương trình thực hành lâm sàng tại cơ sở y tế hợp pháp từ 12 đến 18 tháng tùy thuộc vào văn bằng chuyên môn chuyên khoa và đạt kỳ đánh giá năng lực hành nghề.',
    metadata: { dieu: 22, chu_de: 'CapChungChiHanhNghe', loai_tai_lieu: 'Luat' }
  },
  {
    id: 'doc_3',
    score: 0.8115,
    source: 'Thong_tu_02_2024_TT_BYT.md',
    content: 'Thông tư số 02/2024/TT-BYT hướng dẫn về việc kê đơn thuốc và quản lý dược lâm sàng tại các cơ sở khám bệnh, chữa bệnh tư nhân, đảm bảo liên thông đơn thuốc điện tử quốc gia.',
    metadata: { thong_tu: '02/2024/TT-BYT', chu_de: 'KeDonThuoc' }
  }
];

const MOCK_RERANK: RerankResult[] = [
  { id: 'doc_1', originalRank: 1, newRank: 1, score: 0.9452, content: 'Theo Điều 15 Nghị định 117/2020/NĐ-CP của Chính phủ về xử phạt vi phạm hành chính...' },
  { id: 'doc_2', originalRank: 2, newRank: 2, score: 0.9129, content: 'Điều 22 quy định về điều kiện cấp giấy phép hành nghề y khoa tại Việt Nam...' },
  { id: 'doc_3', originalRank: 3, newRank: 3, score: 0.8251, content: 'Thông tư số 02/2024/TT-BYT hướng dẫn về việc kê đơn thuốc và quản lý dược...' }
];

const MOCK_PROMPT = `[HỆ THỐNG] Bạn là một trợ lý y tế chuyên nghiệp. Hãy sử dụng ngữ cảnh (Context) được cung cấp dưới đây để trả lời câu hỏi (Question) của người dùng một cách chính xác.

Chiến lược: Suy luận chuỗi tư duy (Chain-of-Thought).
Hãy suy nghĩ từng bước một:
1. Đánh giá tất cả triệu chứng lâm sàng và chỉ số sinh hiệu của bệnh nhân hoặc các văn bản luật liên quan.
2. Tra cứu và đối chiếu chéo thông tin với lịch sử y tế hoặc điều khoản pháp lý trong ngữ cảnh đã truy xuất.
3. Xác định các biểu hiện bất thường hoặc yếu tố nguy cơ cao cần lưu ý.
4. Tổng hợp lập luận logic, loại trừ các chẩn đoán/luật phân biệt để đưa ra kết luận lâm sàng/pháp lý cuối cùng.

Ngữ cảnh (Context):
{context}

Câu hỏi (Question):
{query}

Trả lời:`;

const MOCK_METRICS: Metrics = {
  latency: 512,
  tokensUsed: 245,
  retrievalTime: 42,
  rerankTime: 18
};

function AppContent() {
  const { 
    activePage, 
    settings, 
    activeRetrieval, 
    activeRerank, 
    activePrompt, 
    activeMetrics 
  } = useApp();

  const [showFreeNotice, setShowFreeNotice] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('gemini_free_notice_dismissed');
    if (!dismissed) {
      setShowFreeNotice(true);
    }

    const handleOpenNotice = () => {
      setShowFreeNotice(true);
    };

    window.addEventListener('open-free-notice', handleOpenNotice);
    return () => {
      window.removeEventListener('open-free-notice', handleOpenNotice);
    };
  }, []);

  const handleDismissNotice = () => {
    localStorage.setItem('gemini_free_notice_dismissed', 'true');
    setShowFreeNotice(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'chat': return <ChatPage />;
      case 'reranking': return <RerankPage />;
      case 'datasets': return <DatasetsPage />;
      case 'metrics': return <MetricsPage />;
      case 'settings': return <SettingsPage />;
      default: return <ChatPage />;
    }
  };

  return (
    <div className={`flex h-screen bg-canvas text-ink font-sans overflow-hidden transition-colors duration-500 ${settings.theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {settings.showDebugPanel && activePage === 'chat' && (
            <DebugPanel 
              retrievalResults={activeRetrieval}
              rerankResults={activeRerank}
              prompt={activePrompt}
              metrics={activeMetrics}
            />
          )}
        </div>
      </main>

      {/* Ollama Local Integration Guide Modal */}
      <AnimatePresence>
        {showFreeNotice && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/30 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-surface border-4 border-border-pencil p-8 shadow-lg rotate-[-0.5deg] relative overflow-hidden"
              style={{ borderRadius: '15px 40px 15px 40px/40px 15px 40px 15px' }}
            >
              <div className="flex items-center gap-3 mb-6 border-b-2 border-dashed border-border-pencil/20 pb-4">
                <div className="p-2.5 bg-marker text-ink rounded-xl border-2 border-border-pencil rotate-[-3deg]">
                  <Info className="text-ink" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black font-display text-ink leading-tight">
                    TÍCH HỢP OLLAMA LOCAL
                  </h2>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-ink/60 font-bold">
                    Hệ thống LLM local bảo mật riêng tư
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-ink/80">
                <p className="font-bold text-sm bg-marker/10 p-3.5 rounded-xl border-2 border-dashed border-border-pencil/20 italic text-ink">
                  Hệ thống đã được nâng cấp toàn diện sang sử dụng <span className="underline decoration-marker decoration-4 font-black">Ollama Chạy Local</span> để tự động phân tích và xử lý quy trình ViHERMES RAG bảo mật tuyệt đối.
                </p>

                <div className="space-y-2">
                  <h3 className="font-black text-ink uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    ✦ THIẾT LẬP OLLAMA TRÊN MÁY LOCAL
                  </h3>
                  <div className="p-4 bg-canvas border-2 border-border-pencil rounded-xl space-y-3 font-mono text-[11px] text-ink shadow-sm">
                    <div>
                      <span className="font-bold text-medical-blue">1. Khởi động Ollama kèm bật CORS:</span>
                      <pre className="mt-1.5 bg-ink text-white p-2.5 rounded-lg overflow-x-auto text-[10px]">
                        # macOS/Linux:{"\n"}OLLAMA_ORIGINS="*" ollama serve{"\n\n"}# Windows (CMD / PowerShell):{"\n"}set OLLAMA_ORIGINS=*{"\n"}ollama serve
                      </pre>
                    </div>
                    <div>
                      <span className="font-bold text-medical-blue">2. Tải về mô hình mặc định:</span>
                      <pre className="mt-1.5 bg-ink text-white p-2.5 rounded-lg overflow-x-auto text-[10px]">
                        ollama pull qwen3:8b
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 bg-canvas/30 p-4 border-2 border-dashed border-border-pencil/30 rounded-xl">
                  <div className="font-bold text-ink uppercase tracking-widest text-[9px] flex items-center gap-1">
                    ⚠ ƯU ĐIỂM BẢO MẬT TUYỆT ĐỐI (OFFLINE LLM):
                  </div>
                  <p className="text-[10px] text-ink/70 font-medium italic leading-relaxed">
                    Khác với việc sử dụng Cloud APIs, toàn bộ câu hỏi và bối cảnh dữ liệu y tế pháp lý ViHERMES đều được xử lý <span className="font-black underline decoration-marker/80 text-ink">100% offline</span> ngay trên máy cá nhân của bạn, không gửi thông tin ra ngoài môi trường Internet.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <h3 className="font-black text-ink uppercase tracking-wider text-[10px]">
                    TRẠNG THÁI CẤU HÌNH MÔ HÌNH:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-canvas border-2 border-border-pencil rounded-lg text-xs font-bold shadow-sm">
                      <span className="text-ink">Ollama (qwen3:8b)</span>
                      <span className="px-2 py-0.5 bg-marker text-ink border border-border-pencil rounded text-[8px] font-black uppercase tracking-widest">
                        MẶC ĐỊNH
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-canvas/40 border border-border-pencil/40 rounded-lg text-xs font-bold opacity-60">
                      <span className="text-ink/60">Gemini Pro API (Legacy)</span>
                      <span className="px-2 py-0.5 bg-surface border border-border-pencil/40 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        KẾ THỪA
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-dashed border-border-pencil/20 flex justify-end">
                <button
                  onClick={handleDismissNotice}
                  className="px-6 py-2.5 bg-ink text-surface font-display font-black text-xs uppercase tracking-widest rounded-lg border-2 border-border-pencil shadow-md hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-lg active:translate-x-0 active:translate-y-0 transition-all rotate-[-1.5deg] hover:rotate-0 cursor-pointer"
                >
                  BẮT ĐẦU TRUY VẤN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}


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
import RetrievalPage from './pages/RetrievalPage';
import RerankPage from './pages/RerankPage';
import DatasetsPage from './pages/DatasetsPage';
import MetricsPage from './pages/MetricsPage';
import SettingsPage from './pages/SettingsPage';
import { RetrievalResult, RerankResult, Metrics } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Zap, Info, Lock } from 'lucide-react';

const MOCK_RETRIEVAL: RetrievalResult[] = [
  {
    id: '1',
    score: 0.8942,
    source: 'ho_so_lam_sang_v2.pdf',
    content: 'Hệ thống chẩn đoán Med-RAG sử dụng thuật toán nhúng lai tạp (hybrid vector-semantic). Lập chỉ mục hồ sơ bệnh án qua snowflake-arctic-embed-m để tối ưu khả năng truy xuất thông tin chính xác đồng thời duy trì độ trễ tối thiểu.',
    metadata: { trang: 12, muc: 'KienTrucHeThong', tac_gia: 'NhomNoiKhoa' }
  },
  {
    id: '2',
    score: 0.8651,
    source: 'huong_dan_dieu_tri_final.md',
    content: 'Chỉ tiêu độ trễ định mức cho đường truyền truy xuất thông tin lâm sàng luôn ở mức dưới 150ms cho danh sách Top-50 bệnh án cũ trước khi xếp hạng lại. Áp dụng kỹ thuật lọc lược đa tầng vững vàng.',
    metadata: { dong: 450, nhan: 'ChiDanDieuTri', phien_ban: '1.4' }
  },
  {
    id: '3',
    score: 0.8122,
    source: 'yk_benh_nhan_q1.csv',
    content: 'Bệnh nhân báo cáo mức độ phản hồi tích cực và khả năng dung nạp tốt với phác đồ "Deep Glance". Tần suất trùng khớp đặc hiệu đạt 92.4% trong suốt chuỗi đánh giá thử nghiệm lâm sàng.',
    metadata: { hang: 23, cam_nhan: 'tich_cuc' }
  }
];

const MOCK_RERANK: RerankResult[] = [
  { id: '1', originalRank: 2, newRank: 1, score: 0.982, content: 'Chỉ tiêu độ trễ định mức cho đường truyền truy xuất thông tin lâm sàng...' },
  { id: '2', originalRank: 1, newRank: 2, score: 0.941, content: 'Hệ thống chẩn đoán Med-RAG sử dụng thuật toán nhúng lai tạp (hybrid)...' },
  { id: '3', originalRank: 3, newRank: 3, score: 0.823, content: 'Bệnh nhân báo cáo mức độ phản hồi tích cực và khả năng dung nạp tốt...' }
];

const MOCK_PROMPT = `[HỆ THỐNG] Bạn là VIMEDRAG, một trợ lý phân tích lâm sàng thông minh. CHỈ sử dụng thông tin từ bối cảnh bệnh án được cung cấp. Nếu không chắc chắn về triệu chứng, hãy nói rõ "Tôi không có đủ dữ liệu bệnh án đi kèm để đưa ra kết luận".

[BỐI CẢNH LÂM SÀNG]
- Áp dụng bộ lọc lai Snowflake-arctic-embed-m cho lưu trữ chỉ mục.
- Độ trễ chẩn đoán quy chuẩn: < 150ms.
- Phối hợp truy xuất vector kết hợp ngữ nghĩa chuyên sâu.
- Phản hồi điều trị phục hồi của bệnh nhân tốt.

[CÂU HỎI TRUY VẤN]
Tìm hiểu cơ chế vận hành của quy trình chẩn đoán lâm sàng tích hợp và các chỉ tiêu hiệu năng đạt được?

[PHẢN HỒI CHẨN ĐOÁN]`;

const MOCK_METRICS: Metrics = {
  latency: 842,
  tokensUsed: 124,
  retrievalTime: 120,
  rerankTime: 85
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
      case 'retrieval': return <RetrievalPage />;
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

      {/* Gemini Free API Policy Notice Modal */}
      <AnimatePresence>
        {showFreeNotice && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/30 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-surface border-4 border-border-pencil p-8 shadow-lg rotate-[-0.5deg] relative overflow-hidden"
              style={{ borderRadius: '15px 40px 15px 40px/40px 15px 40px 15px' }}
            >
              <div className="flex items-center gap-3 mb-6 border-b-2 border-dashed border-border-pencil/20 pb-4">
                <div className="p-2.5 bg-marker text-ink rounded-xl border-2 border-border-pencil rotate-[-3deg]">
                  <Info className="text-ink" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black font-display text-ink leading-tight">
                    CẤU HÌNH API & QUOTA
                  </h2>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-ink/60 font-bold">
                    Thông tin gói kết nối Google Gemini
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-ink/80">
                <p className="font-bold text-sm bg-marker/10 p-3.5 rounded-xl border-2 border-dashed border-border-pencil/20 italic text-ink">
                  Hệ thống được cấu hình mặc định sử dụng <span className="underline decoration-marker decoration-4 font-black">Google Gemini API Gói Miễn Phí</span> để tự động phân tích và kiểm thử quy trình Med-RAG lâm sàng.
                </p>

                <div className="space-y-2">
                  <h3 className="font-black text-ink uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    ✦ GIỚI HẠN GÓI FREE (FREE-TIER LIMITS)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-canvas border-2 border-border-pencil rounded-xl text-center rotate-[1deg] shadow-sm">
                      <div className="font-mono text-[9px] text-ink/50 font-bold uppercase">Yêu cầu/Phút</div>
                      <div className="text-2xl font-black font-display text-medical-blue mt-1">15</div>
                      <div className="text-[8px] uppercase font-bold text-ink/40 font-mono">15 RPM</div>
                    </div>
                    <div className="p-3 bg-canvas border-2 border-border-pencil rounded-xl text-center rotate-[-1deg] shadow-sm">
                      <div className="font-mono text-[9px] text-ink/50 font-bold uppercase">Yêu cầu/Ngày</div>
                      <div className="text-2xl font-black font-display text-medical-blue mt-1">1,500</div>
                      <div className="text-[8px] uppercase font-bold text-ink/40 font-mono">1.5K RPD</div>
                    </div>
                    <div className="p-3 bg-canvas border-2 border-border-pencil rounded-xl text-center rotate-[0.5deg] shadow-sm">
                      <div className="font-mono text-[9px] text-ink/50 font-bold uppercase">Tokens/Phút</div>
                      <div className="text-sm font-black font-display text-medical-blue mt-2.5 leading-none">1,000,000</div>
                      <div className="text-[8px] uppercase font-bold text-ink/40 font-mono mt-1">1M TPM</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 bg-canvas/30 p-4 border-2 border-dashed border-border-pencil/30 rounded-xl">
                  <div className="font-bold text-ink uppercase tracking-widest text-[9px] flex items-center gap-1">
                    ⚠ CHÍNH SÁCH BẢO MẬT & DỮ LIỆU:
                  </div>
                  <p className="text-[10px] text-ink/70 font-medium italic leading-relaxed">
                    Theo quy định từ Google, dữ liệu gửi qua API gói Miễn phí có thể được thu thập để cải tiến chất lượng mô hình. <span className="font-black underline decoration-marker/80 text-ink">Vui lòng không gửi thông tin danh tính cá nhân thực tế hoặc hồ sơ mật chưa mã hóa của bệnh nhân lên hệ thống!</span>
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <h3 className="font-black text-ink uppercase tracking-wider text-[10px]">
                    TRẠNG THÁI DANH SÁCH MÔ HÌNH:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-canvas border-2 border-border-pencil rounded-lg text-xs font-bold shadow-sm">
                      <span className="text-ink">Gemini 1.5 Flash (Free-Tier)</span>
                      <span className="px-2 py-0.5 bg-marker text-ink border border-border-pencil rounded text-[8px] font-black uppercase tracking-widest">
                        KHẢ DỤNG
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-canvas/40 border border-border-pencil/40 rounded-lg text-xs font-bold opacity-60">
                      <span className="text-ink/60">Gemini 2.5 Pro & GPT-4o</span>
                      <span className="px-2 py-0.5 bg-surface border border-border-pencil/40 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Lock size={9} /> KHÓA
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
                  ĐỒNG Ý & TIẾP TỤC
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


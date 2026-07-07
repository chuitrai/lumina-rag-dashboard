/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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


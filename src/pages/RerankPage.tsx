/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Layers, ArrowUpRight, ArrowDownRight, Minus, Activity, X } from 'lucide-react';
import { RerankResult } from '../types';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

import ragDb from '../data/rag_database.json';

const MOCK_RERANK: RerankResult[] = ragDb.documents.slice(0, 8).map((doc, idx) => {
  // Simulate originalRank and newRank dynamically for demonstration
  return {
    id: doc.id,
    originalRank: (idx % 2 === 0) ? idx + 2 : idx,
    newRank: idx + 1,
    score: 0.99 - (idx * 0.05),
    content: doc.content
  };
});


export default function RerankPage() {
  const { settings } = useApp();
  const [selectedResult, setSelectedResult] = useState<RerankResult | null>(null);

  // Filter based on Top-K setting
  const displayedResults = MOCK_RERANK.slice(0, settings.topK);

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full bg-canvas relative">
      <div className="border-b-4 border-border-pencil pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl">Xếp Hạng <span className="marker-highlight">Chẩn Đoán RAG</span></h1>
          <p className="text-slate-500 text-lg font-bold italic">Quan sát thuật toán Cross-Encoder tối ưu độ ưu tiên của các chỉ mục lâm sàng và quy định y khoa.</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Độ Sâu Ngữ Cảnh</div>
          <div className="text-2xl font-display text-medical-blue underline decoration-marker decoration-4">Sàng lọc Top-{settings.topK}</div>
        </div>
      </div>

      <div className="space-y-6">
        {displayedResults.map((result, idx) => {
          return (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedResult(result)}
              className="sketch-box p-6 bg-white flex items-center gap-8 hover:bg-surface transition-all rotate-[-0.5deg] cursor-pointer group"
            >
              <div className="flex flex-col items-center justify-center w-20 h-20 bg-marker border-2 border-border-pencil rounded-xl shadow-sm rotate-2 group-hover:rotate-0 transition-transform">
                <span className="text-[10px] text-ink font-bold uppercase tracking-widest">Hạng</span>
                <span className="text-4xl font-display text-ink">#{result.newRank}</span>
              </div>

              <div className="flex-1">
                <p className="text-lg text-ink/80 font-medium italic underline decoration-border-pencil/10 line-clamp-1">"{result.content}"</p>
                <div className="mt-4 flex items-center gap-6 text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-400">Mức Độ Chắc Chắn: <span className="text-medical-blue bg-medical-blue/10 px-2 py-0.5 rounded">{(result.score * 100).toFixed(1)}%</span></span>
                  <span className="text-slate-400">Đồng Bộ: <span className="text-green-600">tối ưu hóa</span></span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="w-12 h-12 border-2 border-border-pencil rounded-full flex items-center justify-center bg-canvas shadow-sm rotate-[-45deg] group-hover:rotate-0 transition-transform">
                   <ArrowUpRight size={20} className="text-medical-blue" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Độ Ưu Tiên</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResult(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="sketch-box-irregular max-w-2xl w-full bg-white p-10 z-50 overflow-hidden relative rotate-1"
            >
              <button 
                onClick={() => setSelectedResult(null)}
                className="absolute top-4 right-4 text-ink hover:text-red-500 font-display text-2xl"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 border-2 border-border-pencil rounded-lg flex items-center justify-center bg-marker rotate-[-3deg]">
                  <Activity size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-display">Chi Tiết Bản Ghi Sắp Xếp #{selectedResult.newRank}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Thông Tin Đồng Bộ Reranker Lâm Sàng</p>
                </div>
              </div>
              <div className="p-8 bg-marker/10 border-2 border-dashed border-border-pencil/30 rounded-2xl italic">
                <p className="text-2xl text-ink leading-relaxed">
                  "{selectedResult.content}"
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6">
                 <div className="sketch-box p-4 bg-canvas/30 text-center">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Điểm Re-rank</div>
                   <div className="text-2xl font-display">{(selectedResult.score * 100).toFixed(2)}%</div>
                 </div>
                 <div className="sketch-box p-4 bg-canvas/30 text-center">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Vị Trí Ban Đầu</div>
                   <div className="text-2xl font-display">#{selectedResult.originalRank}</div>
                 </div>
                 <div className="sketch-box p-4 bg-canvas/30 text-center">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Biến Động Hạng</div>
                   <div className="text-2xl font-display text-medical-blue">
                     {selectedResult.originalRank - selectedResult.newRank > 0 ? '+' : ''}{selectedResult.originalRank - selectedResult.newRank}
                   </div>
                 </div>
              </div>
              <div className="mt-8 pt-6 border-t-2 border-dashed border-border-pencil/20 text-center">
                 <button 
                   onClick={() => setSelectedResult(null)}
                   className="px-8 py-3 bg-ink text-white font-display text-lg rotate-1 hover:rotate-0 transition-transform"
                 >
                   XÁC NHẬN CHỈ MỤC
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

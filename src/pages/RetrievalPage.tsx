/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, ExternalLink, Microscope, Filter } from 'lucide-react';
import { RetrievalResult } from '../types';
import { useState, useMemo } from 'react';
import ragDb from '../data/rag_database.json';

export default function RetrievalPage() {
  const [selectedNote, setSelectedNote] = useState<RetrievalResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Map JSON documents into RetrievalResult format
  const documents: RetrievalResult[] = useMemo(() => {
    return ragDb.documents.map((doc, idx) => ({
      id: doc.id,
      score: 0.95 - (idx * 0.04), // Default score sequence
      source: doc.source,
      content: doc.content,
      date: doc.date,
      metadata: doc.metadata
    }));
  }, []);

  // Live Jaccard keyword matching & scoring algorithm to simulate real retrieval!
  const searchedResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents;
    }

    const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    if (queryTerms.length === 0) return documents;

    const matched = documents.map(doc => {
      const textToSearch = `${doc.source} ${doc.content} ${Object.values(doc.metadata).join(' ')}`.toLowerCase();
      let matchCount = 0;
      queryTerms.forEach(term => {
        if (textToSearch.includes(term)) {
          matchCount++;
        }
      });

      // Calculate dynamic score based on matched terms fraction + base vector similarity approximation
      const termScore = matchCount / queryTerms.length;
      const finalScore = termScore > 0 ? (0.4 + termScore * 0.58) : 0.15;

      return {
        ...doc,
        score: finalScore,
        matchCount
      };
    });

    // Sort by matches and scores
    return matched
      .filter(doc => doc.matchCount > 0)
      .sort((a, b) => b.score - a.score);
  }, [documents, searchQuery]);

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full bg-canvas relative">
      <div className="flex items-center justify-between border-b-4 border-border-pencil pb-4">
        <div>
          <h1 className="text-4xl">Truy Xuất <span className="marker-highlight">Bệnh Án</span> Lâm Sàng</h1>
          <p className="text-slate-500 text-lg font-bold italic">Tra cứu lịch sử ca bệnh cũ và các nghiên cứu lâm sàng liên quan.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-marker text-ink border-2 border-border-pencil rounded-full text-xs font-bold uppercase rotate-1 shadow-sm">
          <Microscope size={16} /> Đồng bộ file rag_database.json ({documents.length} phân đoạn)
        </div>
      </div>

      {/* Live Search Inputs */}
      <div className="sketch-box p-6 bg-white shrink-0 rotate-[-0.5deg]">
        <div className="flex items-center gap-3 bg-canvas p-3 rounded-xl border-2 border-border-pencil">
          <Search className="text-medical-blue" size={20} />
          <input
            type="text"
            placeholder="Nhập từ khóa tìm kiếm (ví dụ: HIV, biệt dược, thuế, Boswellia, đàm phán...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-ink placeholder:text-slate-400 text-sm font-bold w-full outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2 text-xs font-black text-slate-400 hover:text-ink cursor-pointer"
            >
              XÓA
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>THUẬT TOÁN: TỰ ĐỘNG BM25/KEYWORD MATCHING SIMULATION</span>
          <span>Tìm thấy {searchedResults.length} phân đoạn phù hợp</span>
        </div>
      </div>

      <div className="grid gap-8">
        {searchedResults.length === 0 ? (
          <div className="sketch-box p-12 bg-white text-center border-2 border-dashed border-border-pencil">
            <Search className="text-slate-300 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-ink">Không có phân đoạn phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1 font-bold">Hãy thử tìm kiếm với các từ khóa khác hoặc chỉnh sửa thêm tài liệu trong `rag_database.json`.</p>
          </div>
        ) : (
          searchedResults.map((result, idx) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="sketch-box-irregular p-8 bg-white hover:bg-surface transition-all group rotate-[0.5deg]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-border-pencil rounded-lg flex items-center justify-center text-border-pencil bg-canvas rotate-[-2deg]">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl underline decoration-marker decoration-4">{result.source}</h3>
                    <div className="flex gap-4 mt-1">
                      {Object.entries(result.metadata).map(([k, v]) => (
                        <span key={k} className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{k} → {v}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">ĐỘ TƯƠNG ĐỒNG</span>
                  <span className="text-2xl font-display text-medical-blue font-black">{result.score.toFixed(4)}</span>
                </div>
              </div>
              <p className="text-lg text-ink/70 leading-relaxed bg-marker/10 p-6 rounded-xl border-2 border-dashed border-border-pencil/30 font-medium italic relative">
                <span className="absolute -top-3 -left-2 text-4xl font-display text-border-pencil/20">"</span>
                {result.content}
                <span className="absolute -bottom-6 -right-2 text-4xl font-display text-border-pencil/20">"</span>
              </p>
              <div className="mt-6 flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-slate-400">📅 Ngày xuất bản: {result.date || 'Chưa rõ'}</span>
                <button 
                  onClick={() => setSelectedNote(result)}
                  className="flex items-center gap-2 text-sm font-bold text-ink hover:underline decoration-marker decoration-[3px] transition-all cursor-pointer"
                >
                  XEM CHI TIẾT BỆNH ÁN <ExternalLink size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>


      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNote(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="sketch-box-irregular max-w-2xl w-full bg-white p-10 z-50 overflow-hidden relative rotate-[-1deg]"
            >
              <button 
                onClick={() => setSelectedNote(null)}
                className="absolute top-4 right-4 text-ink hover:text-red-500 font-display text-2xl"
              >
                X
              </button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 border-2 border-border-pencil rounded-lg flex items-center justify-center bg-marker">
                  <FileText size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-display">{selectedNote.source}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Chi Tiết Hồ Sơ Lâm Sàng</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-ink uppercase tracking-widest text-sm underline decoration-marker mb-2">Tóm Tắt Mở Rộng</h4>
                  <p className="text-xl leading-relaxed italic">{selectedNote.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedNote.metadata).map(([k, v]) => (
                    <div key={k} className="sketch-box p-4 bg-canvas/30">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">{k}</span>
                      <span className="text-lg font-bold text-ink">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t-2 border-dashed border-border-pencil/20">
                  <p className="text-xs text-slate-400 font-mono italic">
                    Lưu ý: Bệnh án này chỉ dùng cho mục đích đồng bộ nghiên cứu lâm sàng nội bộ. Nghiêm cấm mọi hành vi sao tải hay phân phối trái phép khi chưa có sự đồng ý của bệnh nhân.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

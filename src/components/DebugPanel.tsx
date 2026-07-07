/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate } from 'motion/react';
import { Search, Layers, Code, BarChart3, ChevronRight, Copy, Terminal, Sparkles, Activity, Calendar, Filter, CalendarDays } from 'lucide-react';
import { DebugTab, RetrievalResult, RerankResult, Metrics } from '../types';
import { useApp } from '../context/AppContext';

interface DebugPanelProps {
  retrievalResults: RetrievalResult[];
  rerankResults: RerankResult[];
  prompt: string;
  metrics: Metrics;
}

export default function DebugPanel({ retrievalResults, rerankResults, prompt, metrics }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<DebugTab>('retrieval');
  const [selectedRecord, setSelectedRecord] = useState<RetrievalResult | RerankResult | null>(null);

  const tabs = [
    { id: 'retrieval', label: 'Truy Xuất', icon: Search },
    { id: 'rerank', label: 'Xếp Hạng', icon: Layers },
    { id: 'prompt', label: 'Prompt', icon: Code },
    { id: 'metrics', label: 'Chỉ Số', icon: BarChart3 },
  ];

  return (
    <div className="w-[440px] border-l-2 border-border-pencil bg-canvas flex flex-col h-screen overflow-hidden">
      <div className="flex border-b-2 border-border-pencil bg-surface sticky top-0 z-10 px-4 py-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DebugTab)}
            className={`flex-1 py-3 text-xs uppercase tracking-widest transition-all relative rounded-t-lg ${
              activeTab === tab.id 
                ? 'text-ink font-bold bg-marker/40 border-2 border-border-pencil border-b-0 translate-y-[2px] z-20' 
                : 'text-slate-500 font-bold hover:text-ink hover:bg-slate-50 border-2 border-transparent'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="tab-marker" className="absolute inset-0 bg-marker/20 -z-10" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-surface/30 px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'retrieval' && <RetrievalTab results={retrievalResults} onSelect={setSelectedRecord} />}
            {activeTab === 'rerank' && <RerankTab results={rerankResults} onSelect={setSelectedRecord} />}
            {activeTab === 'prompt' && <PromptTab prompt={prompt} />}
            {activeTab === 'metrics' && <MetricsTab metrics={metrics} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-ink/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="sketch-box-irregular bg-white max-w-2xl w-full p-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedRecord(null)}
                className="absolute top-4 right-4 text-ink hover:text-red-500 font-display text-2xl"
              >
                ×
              </button>
              <div className="flex items-center gap-4 mb-6 pt-4">
                 <div className="w-12 h-12 border-2 border-border-pencil rounded-lg flex items-center justify-center bg-marker/20">
                   <Code className="text-medical-blue" size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-display text-ink uppercase tracking-tight">Chi Tiết Bệnh Án Lâm Sàng</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">Nguồn Gốc Hồ Sơ Tri Thức</p>
                 </div>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-canvas border-2 border-border-pencil/20 rounded-xl font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {selectedRecord.content}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="sketch-box p-4 bg-surface/50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Điểm Số Truy Xuất</div>
                    <div className="text-2xl font-display text-medical-blue">{selectedRecord.score.toFixed(4)}</div>
                  </div>
                  <div className="sketch-box p-4 bg-surface/50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Mã Hồ Sơ</div>
                    <div className="text-sm font-mono font-bold text-ink truncate">{selectedRecord.id}</div>
                  </div>
                </div>

                {'metadata' in selectedRecord && (
                  <div className="p-4 border-2 border-border-pencil/10 rounded-lg">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-3">Metadata Đi Kèm</div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {Object.entries(selectedRecord.metadata).map(([key, val]) => (
                        <span key={key} className="px-2 py-1 bg-marker/10 border border-marker/20 rounded-md font-bold uppercase">
                          {key}: <span className="text-ink">{val}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RetrievalTab({ results, onSelect }: { results: RetrievalResult[], onSelect: (r: RetrievalResult) => void }) {
  const [filterType, setFilterType] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const getResultTimeInfo = (result: RetrievalResult) => {
    let dateObj = new Date('2025-01-15');
    if (result.date) {
      dateObj = new Date(result.date);
    } else {
      const src = result.source.toLowerCase();
      if (src.includes('hiv_2025') || src.includes('chuyen_doi_so')) {
        dateObj = new Date('2025-05-10');
      } else if (src.includes('ke_hoach') || src.includes('biet_duoc')) {
        dateObj = new Date('2024-11-20');
      } else if (src.includes('quang_cao') || src.includes('boswellia')) {
        dateObj = new Date('2025-03-05');
      } else if (src.includes('than_kinh')) {
        dateObj = new Date('2024-04-10');
      }
    }

    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const quarter = Math.ceil(month / 3);

    return {
      date: dateObj,
      monthStr: `Tháng ${month}/${year}`,
      quarterStr: `Quý ${quarter}/${year}`,
      yearStr: `Năm ${year}`,
      month,
      quarter,
      year
    };
  };

  const resultsWithTime = results.map(r => ({
    ...r,
    timeInfo: getResultTimeInfo(r)
  }));

  // Fetch unique filter labels automatically
  const uniqueOptions = Array.from(new Set(resultsWithTime.map(r => {
    if (filterType === 'month') return r.timeInfo.monthStr;
    if (filterType === 'quarter') return r.timeInfo.quarterStr;
    if (filterType === 'year') return r.timeInfo.yearStr;
    return '';
  }))).filter(Boolean);

  // Auto-sort to display structured order
  uniqueOptions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));

  // Reset selection on filter category change
  useEffect(() => {
    setSelectedOption(null);
  }, [filterType]);

  const filteredResults = resultsWithTime.filter(r => {
    if (filterType === 'all') return true;
    if (!selectedOption) return true;
    if (filterType === 'month') return r.timeInfo.monthStr === selectedOption;
    if (filterType === 'quarter') return r.timeInfo.quarterStr === selectedOption;
    if (filterType === 'year') return r.timeInfo.yearStr === selectedOption;
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between border-b-2 border-border-pencil pb-2">
        <span className="font-display text-lg text-ink uppercase tracking-widest">Tìm Kiếm Tương Đồng</span>
        <div className="flex items-center gap-2">
           <Terminal size={14} className="text-slate-400" />
           <span className="text-[10px] text-slate-400 font-mono font-bold">TOKENS: 4.102</span>
        </div>
      </div>

      {/* Dynamic Filter Controls */}
      <div className="sketch-box p-4 bg-white space-y-3 rotate-[-0.5deg] border-2 border-border-pencil/80">
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
          <Filter size={12} className="text-medical-blue" />
          <span>Lọc kết quả theo khoảng thời gian</span>
        </div>
        
        {/* Filter categories tabs/buttons */}
        <div className="flex gap-1 bg-canvas p-1 rounded-lg border-2 border-border-pencil/20 text-xs font-bold">
          {(['all', 'month', 'quarter', 'year'] as const).map((type) => {
            const labels = {
              all: 'Tất cả',
              month: 'Tháng',
              quarter: 'Quý',
              year: 'Năm'
            };
            const active = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-1.5 px-2 rounded-md transition-all uppercase text-[10px] tracking-wider text-center cursor-pointer ${
                  active 
                    ? 'bg-ink text-white font-extrabold shadow-sm' 
                    : 'text-slate-500 hover:text-ink font-bold hover:bg-slate-100'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* Dynamic options subcategories selection */}
        {filterType !== 'all' && (
          <div className="pt-2 border-t border-dashed border-border-pencil/20">
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <CalendarDays size={10} />
              Chọn {filterType === 'month' ? 'tháng' : filterType === 'quarter' ? 'quý' : 'năm'}:
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedOption(null)}
                className={`px-2 py-1 text-[10px] rounded-full font-bold transition-all uppercase cursor-pointer ${
                  selectedOption === null
                    ? 'bg-medical-blue/20 text-medical-blue border-2 border-medical-blue'
                    : 'bg-canvas text-slate-500 border border-border-pencil/30 hover:bg-slate-50'
                }`}
              >
                Tất cả {filterType === 'month' ? 'Tháng' : filterType === 'quarter' ? 'Quý' : 'Năm'}
              </button>

              {uniqueOptions.map((opt) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedOption(opt)}
                    className={`px-2.5 py-1 text-[10px] rounded-full font-bold transition-all uppercase cursor-pointer ${
                      isSelected
                        ? 'bg-medical-blue text-white border-2 border-medical-blue font-extrabold shadow-sm'
                        : 'bg-canvas text-ink/80 border border-border-pencil/50 hover:bg-marker/10 hover:border-border-pencil'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="sketch-box p-8 bg-white border-2 border-dashed border-border-pencil text-center rotate-[0.5deg]">
            <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
            <h4 className="text-md font-bold text-ink mb-1">Không có bản ghi</h4>
            <p className="text-xs text-slate-400 font-bold italic">Không tìm thấy tài liệu phù hợp trong khoảng thời gian này.</p>
          </div>
        ) : (
          filteredResults.map((result, idx) => (
            <motion.div
              key={result.id}
              layout
              className="sketch-box p-5 bg-white relative group cursor-pointer hover:bg-surface transition-colors rotate-[0.5deg]"
              onClick={() => onSelect(result)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 border-2 border-border-pencil rounded flex items-center justify-center text-[10px] font-mono font-bold bg-marker">#{idx + 1}</span>
                  <span className="text-sm font-bold text-ink truncate max-w-[200px] underline decoration-border-pencil/30">{result.source}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-lg font-bold text-ink leading-none">{result.score.toFixed(3)}</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase">TƯƠNG ĐỒNG</span>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed font-medium italic line-clamp-2">
                "{result.content}"
              </p>

              <div className="mt-4 pt-3 flex justify-between items-center border-t border-dashed border-border-pencil/20">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-marker/25 px-2 py-0.5 rounded border border-border-pencil/30 font-bold text-ink italic">
                    📅 {result.timeInfo.monthStr}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-black text-medical-blue uppercase tracking-widest">Xem chi tiết</span>
                   <ChevronRight size={14} className="text-border-pencil" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function RerankTab({ results, onSelect }: { results: RerankResult[], onSelect: (r: RerankResult) => void }) {
  const { settings } = useApp();
  
  // Filter based on Top-K setting to sync with settings
  const displayedResults = results.slice(0, settings.topK);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between border-b-2 border-border-pencil pb-2">
        <span className="font-display text-lg text-ink uppercase tracking-widest">Thuật Toán Reranker</span>
        <span className="text-[10px] font-black text-medical-blue">ĐỒNG BỘ TOP-{settings.topK}</span>
      </div>
      <div className="space-y-4">
        {displayedResults.map((result, idx) => {
          const rankDiff = result.originalRank - result.newRank;
          return (
            <motion.div
              key={result.id}
              layout
              className="sketch-box-irregular p-5 bg-white flex items-center justify-between group hover:bg-surface transition-all rotate-[-0.5deg] cursor-pointer"
              onClick={() => onSelect(result)}
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-2 border-border-pencil rounded-full flex items-center justify-center bg-marker text-xl font-bold text-ink shadow-sm">
                    {result.newRank}
                  </div>
                  {rankDiff !== 0 && (
                    <div className={`mt-2 flex items-center p-1 rounded font-bold text-[10px] ${rankDiff > 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                      {rankDiff > 0 ? '↑' : '↓'} {Math.abs(rankDiff)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-slate-600 line-clamp-1 max-w-[220px] font-medium leading-relaxed underline decoration-marker/50 decoration-[3px]">
                    {result.content}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-2">
                    <span className="text-slate-300">ĐỘ TRÙNG KHỚP LÂM SÀNG:</span> {(result.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={18} className="text-border-pencil" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PromptTab({ prompt: initialPrompt }: { prompt: string }) {
  const { systemPrompt, setSystemPrompt } = useApp();
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(localPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSystemPrompt(localPrompt);
    setIsEditing(false);
  };

  const STRATEGIES = [
    { label: 'Zero-Shot', icon: Sparkles, text: '\n\nChiến lược: Phân tích Zero-Shot.\nPhân tích ca bệnh của bệnh nhân và chẩn đoán trực tiếp chỉ dựa trên ngữ cảnh đã truy xuất.' },
    { label: 'Few-Shot', icon: Layers, text: '\n\nChiến lược: Khởi gợi vài ví dụ (Few-Shot).\nVí dụ mẫu:\nTrường hợp #121: Mệt mỏi kéo dài -> Chẩn đoán: Thiếu hụt B12\nTrường hợp #154: Tim đập nhanh -> Chẩn đoán: Cường giáp\nCa bệnh hiện tại: ' },
    { label: 'CoT', icon: Activity, text: '\n\nChiến lược: Suy luận chuỗi tư duy (Chain-of-Thought).\nSuy nghĩ từng bước một:\n1. Đánh giá tất cả chỉ số sinh hiệu\n2. Tra cứu đối chiếu chéo lịch sử y tế\n3. Xác định các biểu hiện bất thường\n4. Tổng hợp và chẩn đoán lâm sàng.' }
  ];

  const insertStrategy = (text: string) => {
    if (isEditing) {
      setLocalPrompt(prev => prev + text);
    } else {
      setSystemPrompt(systemPrompt + text);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-20">
      <div className="flex items-center justify-between border-b-2 border-border-pencil pb-2">
        <span className="font-display text-lg text-ink uppercase tracking-widest">Cấu Hình Prompt</span>
        <div className="flex items-center gap-4">
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="text-ink hover:text-blue-700 text-xs font-bold uppercase tracking-widest decoration-marker underline decoration-4"
            >
              LƯU LẠI
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-slate-500 hover:text-ink text-xs font-bold uppercase tracking-widest"
            >
              CHỈNH SỬA
            </button>
          )}
          <button 
            onClick={handleCopy}
            className="text-slate-500 hover:text-ink flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            {copied ? 'ĐÃ SAO CHÉP!' : <><Copy size={14} /> SAO CHÉP</>}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STRATEGIES.map((strat) => (
          <button
            key={strat.label}
            onClick={() => insertStrategy(strat.text)}
            className="sketch-box-irregular px-3 py-1 bg-surface hover:bg-marker/30 transition-all text-[9px] font-black uppercase flex items-center gap-2"
          >
            <strat.icon size={10} className="text-medical-blue" />
            {strat.label}
          </button>
        ))}
      </div>
      {isEditing ? (
        <textarea
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          className="flex-1 sketch-box p-6 font-mono text-xs leading-relaxed text-slate-700 outline-none focus:ring-4 focus:ring-marker/20 transition-all resize-none bg-surface/50"
          spellCheck={false}
        />
      ) : (
        <div className="flex-1 sketch-box-irregular p-8 font-mono text-xs leading-relaxed text-ink/70 whitespace-pre-wrap selection:bg-marker relative overflow-y-auto">
          {systemPrompt}
          <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
            <Terminal size={40} />
          </div>
        </div>
      )}
      <div className="bg-marker/20 border-l-4 border-marker p-4 text-[11px] font-bold text-ink italic leading-relaxed">
        * SỬ DỤNG {"{CONTEXT}"} VÀ {"{QUERY}"} ĐỂ TỰ ĐỘNG CHÈN NGỮ CẢNH VÀ TRUY VẤN DỐI TƯỢNG.
      </div>
    </div>
  );
}

function MetricsTab({ metrics }: { metrics: Metrics }) {
  return (
    <div className="space-y-10">
       <div className="flex items-center justify-between border-b-2 border-border-pencil pb-2">
        <span className="font-display text-lg text-ink uppercase tracking-widest">Phân Tích Med-RAG</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <MetricCard label="Tổng Độ Trễ Quy Trình" value={metrics.latency / 1000} unit="giây" />
        <MetricCard label="Tokens Sử Dụng" value={metrics.tokensUsed} unit="tkn" />
        <MetricCard label="Thời Gian Truy Xuất" value={metrics.retrievalTime} unit="ms" />
        <MetricCard label="Đồng Bộ Rerank" value={metrics.rerankTime} unit="ms" />
      </div>

      <div className="pt-8 space-y-6">
        <span className="font-display text-sm text-ink uppercase tracking-widest">Chất Lượng Mô Hình</span>
        <HealthBar label="Độ Chính Xác Ngữ Cảnh" value={0.92} color="bg-ink" />
        <HealthBar label="Tỉ Lệ Tín Hiệu / Nhiễu" value={0.85} color="bg-ink" />
        <HealthBar label="Mức Độ Tin Cậy" value={0.98} color="bg-ink" />
      </div>

      <div className="sketch-box p-6 bg-surface rotate-[1deg]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-ink font-bold uppercase tracking-widest">Hạn Mức Bộ Nhớ Token</span>
          <span className="text-[10px] font-mono font-bold">4.2K / 12.0K</span>
        </div>
        <div className="flex gap-2 h-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div 
              key={i}
              className={`flex-1 border-2 border-border-pencil rounded-sm ${i <= 3 ? 'bg-border-pencil' : 'bg-transparent'}`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string, value: number, unit: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.34, 1.56, 0.64, 1], // bouncy sketch energy
      onUpdate: (latest) => setDisplayValue(latest)
    });
    return () => controls.stop();
  }, [value]);

  return (
    <div className="sketch-box-irregular p-5 bg-white group hover:translate-y-[-2px] transition-transform rotate-[-1deg] hover:bg-surface">
      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">{label}</span>
      <div className="flex items-baseline gap-2 mt-2">
        <motion.span className="text-3xl font-display text-ink tabular-nums">
          {unit === 'sec' ? displayValue.toFixed(2) : Math.floor(displayValue)}
        </motion.span>
        <span className="text-xs text-slate-400 font-bold uppercase italic">{unit}</span>
      </div>
      <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <BarChart3 size={20} />
      </div>
    </div>
  );
}

function HealthBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-ink uppercase tracking-widest">{label}</span>
        <span className="text-ink font-display text-lg">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-4 w-full border-2 border-border-pencil p-[2px] rounded-sm bg-white overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          className={`h-full ${color}`}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ borderRadius: '2px' }}
        />
      </div>
    </div>
  );
}

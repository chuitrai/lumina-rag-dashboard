/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, TrendingUp, Cpu, Zap, Award, CheckCircle2,
  AlertTriangle, FileText, Layers, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';

// Table 5.1: Kết quả toàn diện của hệ thống VectorRAG trên tập ViHermes
const TABLE_5_1_DATA = [
  // Zero-Shot
  { prompting: 'Zero-Shot', strategy: 'Dense', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.4187, bert: 0.7522, recall: 0.6919 },
  { prompting: 'Zero-Shot', strategy: 'Dense', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4892, bert: 0.7820, recall: 0.9013 },
  { prompting: 'Zero-Shot', strategy: 'Dense', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4219, bert: 0.7521, recall: 0.7303 },
  { prompting: 'Zero-Shot', strategy: 'BM25', embedding: 'BM25', reranker: 'BGE-v2-m3', f1: 0.4897, bert: 0.7816, recall: 0.9097 },
  { prompting: 'Zero-Shot', strategy: 'Hybrid', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.4892, bert: 0.7817, recall: 0.8975 },
  { prompting: 'Zero-Shot', strategy: 'Hybrid', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4918, bert: 0.7830, recall: 0.9116 },
  { prompting: 'Zero-Shot', strategy: 'Hybrid', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4897, bert: 0.7820, recall: 0.9020 },

  // Few-Shot
  { prompting: 'Few-Shot', strategy: 'Dense', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.3700, bert: 0.7195, recall: 0.4509 },
  { prompting: 'Few-Shot', strategy: 'Dense', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4088, bert: 0.7356, recall: 0.9121 },
  { prompting: 'Few-Shot', strategy: 'Dense', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4130, bert: 0.7374, recall: 0.8999 },
  { prompting: 'Few-Shot', strategy: 'BM25', embedding: 'BM25', reranker: 'BGE-v2-m3', f1: 0.4059, bert: 0.7343, recall: 0.9153 },
  { prompting: 'Few-Shot', strategy: 'Hybrid', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.3883, bert: 0.7273, recall: 0.8467 },
  { prompting: 'Few-Shot', strategy: 'Hybrid', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4462, bert: 0.7524, recall: 0.9183 },
  { prompting: 'Few-Shot', strategy: 'Hybrid', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4067, bert: 0.7350, recall: 0.9102 },

  // CoT
  { prompting: 'CoT', strategy: 'Dense', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.5006, bert: 0.7902, recall: 0.6944 },
  { prompting: 'CoT', strategy: 'Dense', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.5717, bert: 0.8166, recall: 0.9033 },
  { prompting: 'CoT', strategy: 'Dense', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.5710, bert: 0.8158, recall: 0.8872 },
  { prompting: 'CoT', strategy: 'BM25', embedding: 'BM25', reranker: 'BGE-v2-m3', f1: 0.5717, bert: 0.8163, recall: 0.9090 },
  { prompting: 'CoT', strategy: 'Hybrid', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.5715, bert: 0.8154, recall: 0.8981 },
  { prompting: 'CoT', strategy: 'Hybrid', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.5774, bert: 0.8179, recall: 0.9129 },
  { prompting: 'CoT', strategy: 'Hybrid', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.5740, bert: 0.8175, recall: 0.9065 }
];

// Table 5.2: Ablation study của reranker trên cấu hình CoT + Hybrid + bge-m3
const RERANKER_ABLATION_DATA = [
  { name: 'bge-reranker-v2-m3', f1: 0.5774, bert: 0.8179, recall: 0.9129, desc: 'Lựa chọn tối ưu nhất cho pháp lý y tế tiếng Việt.' },
  { name: 'mmarco-mMiniLMv2', f1: 0.3946, bert: 0.7081, recall: 0.7338, desc: 'Mô hình nhỏ, độ chính xác giảm mạnh do mất ngữ cảnh y tế.' },
  { name: 'ms-marco-MiniLM', f1: 0.3942, bert: 0.7068, recall: 0.5869, desc: 'Không tương thích tốt với tiếng Việt chuyên ngành hành chính.' },
  { name: 'None (Truy xuất thô)', f1: 0.3945, bert: 0.7073, recall: 0.8672, desc: 'Recall khá nhưng không xếp hạng lại, câu trả lời bị mờ nhạt.' }
];

export default function MetricsPage() {
  const [activeTab, setActiveTab] = useState<'comprehensive' | 'reranker' | 'errors'>('comprehensive');
  const [promptFilter, setPromptFilter] = useState<'All' | 'Zero-Shot' | 'Few-Shot' | 'CoT'>('All');
  const [strategyFilter, setStrategyFilter] = useState<'All' | 'Dense' | 'BM25' | 'Hybrid'>('All');

  // Filtered Table 5.1 Data
  const filteredTableData = useMemo(() => {
    return TABLE_5_1_DATA.filter(item => {
      const matchPrompt = promptFilter === 'All' || item.prompting === promptFilter;
      const matchStrategy = strategyFilter === 'All' || item.strategy === strategyFilter;
      return matchPrompt && matchStrategy;
    });
  }, [promptFilter, strategyFilter]);

  // Aggregate Chart Data for Prompting Strategy comparison
  const aggregatedPromptingData = useMemo(() => {
    const prompts = ['Zero-Shot', 'Few-Shot', 'CoT'];
    return prompts.map(p => {
      const subset = TABLE_5_1_DATA.filter(item => item.prompting === p);
      const avgF1 = subset.reduce((acc, curr) => acc + curr.f1, 0) / subset.length;
      const avgBert = subset.reduce((acc, curr) => acc + curr.bert, 0) / subset.length;
      const avgRecall = subset.reduce((acc, curr) => acc + curr.recall, 0) / subset.length;
      return {
        name: p,
        'F1-Score': parseFloat(avgF1.toFixed(4)),
        'BERTScore': parseFloat(avgBert.toFixed(4)),
        'Recall@5': parseFloat(avgRecall.toFixed(4))
      };
    });
  }, []);

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full bg-canvas">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-border-pencil pb-4">
        <div>
          <h1 className="text-4xl text-medical-blue font-display">Kết Quả Đánh Giá & Thực Nghiệm RAG</h1>
          <p className="text-slate-500 text-lg font-bold italic">
            Số liệu thống kê khoa học trích xuất trực tiếp từ báo cáo nghiên cứu RAG trên tập dữ liệu tiếng Việt ViHERMES.
          </p>
        </div>
        <div className="sketch-box bg-marker/20 px-6 py-2 rotate-[-1deg] text-xs font-black uppercase tracking-widest border-2 border-border-pencil">
          Dataset: ViHERMES (1,560 mẫu)
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="sketch-box-irregular p-6 bg-white rotate-[0.5deg]">
          <div className="w-10 h-10 bg-green-100 border-2 border-green-700 rounded-lg flex items-center justify-center text-green-700 mb-3 rotate-[-3deg]">
            <Award size={20} />
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">F1-Score Tối Ưu</div>
          <div className="text-3xl font-display font-black text-ink mt-1">0.5774</div>
          <p className="text-[10px] text-slate-500 italic font-bold mt-1">Cấu hình: CoT + Hybrid (bge-m3)</p>
        </div>

        <div className="sketch-box-irregular p-6 bg-white rotate-[-0.5deg]">
          <div className="w-10 h-10 bg-blue-100 border-2 border-blue-700 rounded-lg flex items-center justify-center text-blue-700 mb-3 rotate-3">
            <Zap size={20} />
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">BERTScore Cao Nhất</div>
          <div className="text-3xl font-display font-black text-ink mt-1">0.8179</div>
          <p className="text-[10px] text-slate-500 italic font-bold mt-1">Thể hiện sự tương đồng ngữ nghĩa cực cao</p>
        </div>

        <div className="sketch-box-irregular p-6 bg-white rotate-[1deg]">
          <div className="w-10 h-10 bg-yellow-100 border-2 border-yellow-700 rounded-lg flex items-center justify-center text-yellow-700 mb-3 rotate-[-2deg]">
            <TrendingUp size={20} />
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Recall@5 Đỉnh Điểm</div>
          <div className="text-3xl font-display font-black text-ink mt-1">91.83%</div>
          <p className="text-[10px] text-slate-500 italic font-bold mt-1">Chiến lược Hybrid (bge-m3) ở Few-Shot</p>
        </div>

        <div className="sketch-box-irregular p-6 bg-white rotate-[-1deg]">
          <div className="w-10 h-10 bg-purple-100 border-2 border-purple-700 rounded-lg flex items-center justify-center text-purple-700 mb-3 rotate-2">
            <Cpu size={20} />
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Quy mô thử nghiệm</div>
          <div className="text-3xl font-display font-black text-ink mt-1">1,560</div>
          <p className="text-[10px] text-slate-500 italic font-bold mt-1">Phân bổ đều từ 1-hop đến 5-hop</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-border-pencil">
        <button
          onClick={() => setActiveTab('comprehensive')}
          className={`px-6 py-3 font-display text-lg tracking-tight border-t-2 border-x-2 rounded-t-xl transition-all mr-2 ${
            activeTab === 'comprehensive'
              ? 'bg-white border-border-pencil border-b-white translate-y-[2px] font-bold text-medical-blue'
              : 'bg-canvas/40 border-transparent text-slate-400 hover:text-ink'
          }`}
        >
          Bảng Kết Quả Toàn Diện (Table 5.1)
        </button>
        <button
          onClick={() => setActiveTab('reranker')}
          className={`px-6 py-3 font-display text-lg tracking-tight border-t-2 border-x-2 rounded-t-xl transition-all mr-2 ${
            activeTab === 'reranker'
              ? 'bg-white border-border-pencil border-b-white translate-y-[2px] font-bold text-medical-blue'
              : 'bg-canvas/40 border-transparent text-slate-400 hover:text-ink'
          }`}
        >
          Phân Tích Bộ Xếp Hạng Lại (Table 5.2)
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`px-6 py-3 font-display text-lg tracking-tight border-t-2 border-x-2 rounded-t-xl transition-all ${
            activeTab === 'errors'
              ? 'bg-white border-border-pencil border-b-white translate-y-[2px] font-bold text-red-600'
              : 'bg-canvas/40 border-transparent text-slate-400 hover:text-ink'
          }`}
        >
          Phân Tích Lỗi (Error Analysis)
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: Comprehensive Table 5.1 */}
          {activeTab === 'comprehensive' && (
            <div className="space-y-8">
              {/* Charts Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="sketch-box p-8 bg-white lg:col-span-2 rotate-[0.5deg]">
                  <h3 className="font-display text-xl text-ink underline decoration-marker decoration-4 mb-6">
                    Biểu Đồ So Sánh Hiệu Năng Theo Chiến Lược Prompting
                  </h3>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregatedPromptingData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b55631a" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 'bold' }} 
                        />
                        <YAxis 
                          domain={[0, 1]}
                          axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }} 
                        />
                        <Tooltip 
                          contentStyle={{ border: '2px solid #4b5563', borderRadius: '8px', background: '#fffdfa', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        <Bar name="F1-Score trung bình" dataKey="F1-Score" fill="#f87171" stroke="#4b5563" strokeWidth={2} radius={[4, 4, 0, 0]} />
                        <Bar name="BERTScore trung bình" dataKey="BERTScore" fill="#60a5fa" stroke="#4b5563" strokeWidth={2} radius={[4, 4, 0, 0]} />
                        <Bar name="Recall@5 trung bình" dataKey="Recall@5" fill="#34d399" stroke="#4b5563" strokeWidth={2} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-xs text-slate-400 font-bold italic mt-3 flex items-center gap-1">
                    <Sparkles size={12} className="text-medical-blue" />
                    Biểu đồ thể hiện sự vượt trội toàn cục của phương pháp Chain-of-Thought (CoT) đối với chất lượng suy luận pháp quy y tế đa bước.
                  </div>
                </div>

                <div className="sketch-box-irregular p-8 bg-white rotate-[-0.5deg] flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl text-ink underline decoration-marker decoration-4 mb-4">
                      Kết Luận Quan Trọng
                    </h3>
                    <ul className="space-y-4 text-sm font-bold text-slate-600 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <ChevronRight size={18} className="text-medical-blue shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-ink">Chain-of-Thought vượt trội:</strong> Đạt điểm F1 = 0.5774 và BERTScore = 0.8179 cao nhất nhờ việc bắt buộc LLM suy nghĩ từng bước, bám sát logic của văn bản quy phạm.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight size={18} className="text-medical-blue shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-ink">Chiến lược Hybrid ổn định nhất:</strong> Việc kết hợp giữa Dense Retrieval (bge-m3) và Lexical Retrieval (BM25) mang lại chỉ số Recall@5 cao nhất (0.9183 ở kịch bản Few-Shot).
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight size={18} className="text-medical-blue shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-ink">Sụt giảm tại Few-Shot:</strong> Trái với thông thường, Few-Shot lại có điểm F1 rất kém (chỉ còn 0.4462 ở Hybrid bge-m3) do bị "Context Overload" và "Lost in the middle".
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="sketch-box p-8 bg-white rotate-[-0.5deg]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-dashed border-border-pencil/20 pb-4">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-medical-blue" />
                    <h3 className="font-display text-xl text-ink">Bảng Dữ Liệu Thực Nghiệm Chi Tiết</h3>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 uppercase">Prompting:</span>
                      <select 
                        value={promptFilter}
                        onChange={(e) => setPromptFilter(e.target.value as any)}
                        className="bg-canvas border-2 border-border-pencil px-3 py-1.5 rounded-lg text-xs"
                      >
                        <option value="All">Tất cả</option>
                        <option value="Zero-Shot">Zero-Shot</option>
                        <option value="Few-Shot">Few-Shot</option>
                        <option value="CoT">Chain-of-Thought (CoT)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 uppercase">Truy xuất:</span>
                      <select 
                        value={strategyFilter}
                        onChange={(e) => setStrategyFilter(e.target.value as any)}
                        className="bg-canvas border-2 border-border-pencil px-3 py-1.5 rounded-lg text-xs"
                      >
                        <option value="All">Tất cả</option>
                        <option value="Dense">Dense (Vector)</option>
                        <option value="BM25">BM25 (Từ khóa)</option>
                        <option value="Hybrid">Hybrid (Lai tạp)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b-2 border-border-pencil bg-canvas text-xs font-black uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Kỹ Thuật Lời Nhắc</th>
                        <th className="py-3 px-4">Chiến Lược Truy Xuất</th>
                        <th className="py-3 px-4">Mô Hình Nhúng</th>
                        <th className="py-3 px-4 text-center">F1-Score</th>
                        <th className="py-3 px-4 text-center">BERTScore</th>
                        <th className="py-3 px-4 text-center">Recall@5</th>
                        <th className="py-3 px-4 text-center">Đánh Giá</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold divide-y divide-border-pencil/10">
                      {filteredTableData.map((row, idx) => {
                        const isOptimal = row.prompting === 'CoT' && row.strategy === 'Hybrid' && row.embedding === 'bge-m3';
                        return (
                          <tr 
                            key={idx} 
                            className={`transition-colors ${
                              isOptimal 
                                ? 'bg-green-50 text-green-900 border-2 border-green-700' 
                                : 'hover:bg-canvas/40 text-slate-700'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-display text-md">{row.prompting}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded text-xs uppercase ${
                                row.strategy === 'Hybrid' ? 'bg-purple-100 text-purple-700' :
                                row.strategy === 'BM25' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {row.strategy}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs">{row.embedding}</td>
                            <td className={`py-3.5 px-4 text-center font-mono ${isOptimal ? 'text-xl font-black text-green-700' : ''}`}>
                              {row.f1.toFixed(4)}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono">{row.bert.toFixed(4)}</td>
                            <td className="py-3.5 px-4 text-center font-mono">{row.recall.toFixed(4)}</td>
                            <td className="py-3.5 px-4 text-center">
                              {isOptimal ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-green-700 text-white px-2 py-0.5 rounded-full font-black uppercase">
                                  <CheckCircle2 size={10} /> TỐI ƯU NHẤT
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium italic">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Reranker Ablation Study */}
          {activeTab === 'reranker' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Ablation Chart */}
              <div className="sketch-box p-8 bg-white lg:col-span-2 rotate-[0.5deg]">
                <h3 className="font-display text-xl text-ink underline decoration-marker decoration-4 mb-6">
                  Ablation Study: So Sánh Hiệu Quả Xếp Hạng Lại (Reranker)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={RERANKER_ABLATION_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b55631a" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#4b5563', fontWeight: 'bold' }} 
                      />
                      <YAxis 
                        domain={[0, 1]}
                        axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }} 
                      />
                      <Tooltip 
                        contentStyle={{ border: '2px solid #4b5563', borderRadius: '8px', background: '#fffdfa', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar name="F1-Score" dataKey="f1" fill="#ec4899" stroke="#4b5563" strokeWidth={2} radius={[4, 4, 0, 0]} />
                      <Bar name="BERTScore" dataKey="bert" fill="#8b5cf6" stroke="#4b5563" strokeWidth={2} radius={[4, 4, 0, 0]} />
                      <Bar name="Recall@5" dataKey="recall" fill="#06b6d4" stroke="#4b5563" strokeWidth={2} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-xl text-xs text-slate-700 leading-relaxed font-bold">
                  <strong>Khám phá cốt lõi:</strong> Reranker đóng vai trò quan trọng bậc nhất để đẩy các đoạn tài liệu đúng lên hàng đầu (Top-1). Bằng chứng là khi tháo bỏ Reranker (None), điểm Recall@5 vẫn duy trì cao ở mức 0.8672 nhưng điểm sinh câu trả lời F1-Score bị sụt giảm thảm hại xuống 0.3945 (do LLM bị phân tâm bởi các tài liệu nhiễu xếp phía trên).
                </div>
              </div>

              {/* Reranker Details list */}
              <div className="space-y-6">
                {RERANKER_ABLATION_DATA.map((item, idx) => {
                  const isBest = item.name === 'bge-reranker-v2-m3';
                  return (
                    <div 
                      key={idx} 
                      className={`sketch-box-irregular p-5 bg-white transition-all ${
                        isBest ? 'border-green-700 border-2 bg-green-50/50 rotate-[-1deg]' : 'rotate-[1deg]'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-border-pencil/10 pb-2 mb-3">
                        <span className="font-mono text-xs font-black text-ink">{item.name}</span>
                        {isBest && (
                          <span className="text-[9px] bg-green-700 text-white px-2 py-0.5 rounded-full font-black">
                            TỐI ƯU NHẤT
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-500 italic mb-4 leading-relaxed">
                        {item.desc}
                      </p>
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-ink">
                        <div>
                          <div className="text-slate-400 uppercase text-[9px]">F1-Score</div>
                          <div className={isBest ? 'text-green-700 font-extrabold text-lg' : ''}>{item.f1.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 uppercase text-[9px]">BERTScore</div>
                          <div>{item.bert.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 uppercase text-[9px]">Recall@5</div>
                          <div>{item.recall.toFixed(4)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Error Analysis */}
          {activeTab === 'errors' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Error 1 */}
              <div className="sketch-box-irregular p-8 bg-white border-red-200 hover:border-red-600 transition-colors rotate-[-0.5deg]">
                <div className="w-12 h-12 bg-red-100 border-2 border-red-700 rounded-xl flex items-center justify-center text-red-700 mb-6 rotate-[-4deg] shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="font-display text-xl text-ink underline decoration-red-200 decoration-8">
                  Phân Mảnh Từ Vựng (Token Fragmentation)
                </h4>
                <p className="text-xs text-red-600 font-mono uppercase tracking-widest mt-1 mb-4">
                  Ảnh hưởng: nomic-text / multilingual-e5
                </p>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">
                  Khi sử dụng các mô hình nhúng thiên về tiếng Anh hoặc không tối ưu sâu cho tiếng Việt chuyên ngành (như nomic-text), các thuật ngữ y khoa hành chính đặc thù như <code className="bg-canvas px-1 rounded text-red-600 font-mono">"chỉ định"</code>, <code className="bg-canvas px-1 rounded text-red-600 font-mono">"tác dụng phụ"</code> bị chia nhỏ thành các ký tự vụn vặt. Điều này bẻ gãy biểu diễn ngữ nghĩa vector, khiến kết quả truy xuất bị sai lệch và kéo thấp Recall@5 toàn hệ thống.
                </p>
              </div>

              {/* Error 2 */}
              <div className="sketch-box-irregular p-8 bg-white border-red-200 hover:border-red-600 transition-colors rotate-[0.5deg]">
                <div className="w-12 h-12 bg-red-100 border-2 border-red-700 rounded-xl flex items-center justify-center text-red-700 mb-6 rotate-[3deg] shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="font-display text-xl text-ink underline decoration-red-200 decoration-8">
                  Quá Tải Ngữ Cảnh (Context Overload)
                </h4>
                <p className="text-xs text-red-600 font-mono uppercase tracking-widest mt-1 mb-4">
                  Ảnh hưởng tiêu cực: Few-Shot Prompting
                </p>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">
                  Trong thiết lập Few-Shot, việc cố nhồi nhét nhiều ví dụ mẫu dài dòng cộng thêm hàng loạt văn bản quy phạm được truy xuất từ bên ngoài đã vượt quá điểm tối ưu của cửa sổ ngữ cảnh LLM. Hệ quả là hiện tượng <strong className="text-ink">"Lost in the middle"</strong> xuất hiện, khiến mô hình Qwen2.5 bị rối loạn, bỏ sót hoặc bỏ qua các điều khoản luật quan trọng nằm ở giữa chuỗi dữ liệu.
                </p>
              </div>

              {/* Error 3 */}
              <div className="sketch-box-irregular p-8 bg-white border-red-200 hover:border-red-600 transition-colors rotate-[-1deg]">
                <div className="w-12 h-12 bg-red-100 border-2 border-red-700 rounded-xl flex items-center justify-center text-red-700 mb-6 rotate-[-2deg] shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="font-display text-xl text-ink underline decoration-red-200 decoration-8">
                  Phạt Điểm Định Dạng (Format Penalization)
                </h4>
                <p className="text-xs text-red-600 font-mono uppercase tracking-widest mt-1 mb-4">
                  Ảnh hưởng: Chỉ số F1-Score (mức token)
                </p>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">
                  Ở một số kịch bản, điểm BERTScore vẫn duy trì ở mức cao khá ổn định (0.73 - 0.75) nhưng điểm F1-Score lại rất thấp. Nguyên nhân là do LLM (Qwen2.5) sinh ra câu trả lời có ngữ nghĩa hoàn toàn đúng đắn và đủ ý, nhưng lại diễn giải dài dòng, mạch lạc hơn nhiều so với đáp án chuẩn (vốn cực kỳ ngắn gọn và cô đọng trong tập dữ liệu). Việc này làm giảm đáng kể điểm trùng khớp từ vựng F1 ở cấp độ token.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

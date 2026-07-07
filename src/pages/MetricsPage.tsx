/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, TrendingUp, Cpu, Zap, Clock, ChevronDown, 
  FileText, Database, Layers, Sparkles, HelpCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend 
} from 'recharts';
import ragDb from '../data/rag_database.json';

export default function MetricsPage() {
  const [selectedMetricType, setSelectedMetricType] = useState<'latency' | 'tokens'>('latency');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(ragDb.questions[0]?.id || null);

  // 1. Calculate real-time statistics from the actual rag_database.json
  const stats = useMemo(() => {
    const totalDocs = ragDb.documents.length;
    const totalQuestions = ragDb.questions.length;

    let sumLatency = 0;
    let sumRetrievalTime = 0;
    let sumRerankTime = 0;
    let sumTokens = 0;

    ragDb.questions.forEach((q) => {
      sumLatency += q.metrics.latency;
      sumRetrievalTime += q.metrics.retrievalTime;
      sumRerankTime += q.metrics.rerankTime;
      sumTokens += q.metrics.tokensUsed;
    });

    const avgLatency = totalQuestions > 0 ? Math.round(sumLatency / totalQuestions) : 0;
    const avgRetrieval = totalQuestions > 0 ? Math.round(sumRetrievalTime / totalQuestions) : 0;
    const avgRerank = totalQuestions > 0 ? Math.round(sumRerankTime / totalQuestions) : 0;
    const avgTokens = totalQuestions > 0 ? Math.round(sumTokens / totalQuestions) : 0;

    // Source Distribution
    const sourceMap: Record<string, number> = {};
    ragDb.documents.forEach((doc) => {
      sourceMap[doc.source] = (sourceMap[doc.source] || 0) + 1;
    });

    const sources = Object.entries(sourceMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalDocs) * 100),
    })).sort((a, b) => b.count - a.count);

    return {
      totalDocs,
      totalQuestions,
      avgLatency,
      avgRetrieval,
      avgRerank,
      avgTokens,
      sources,
    };
  }, []);

  // 2. Map evaluation queries to Chart data
  const chartData = useMemo(() => {
    return ragDb.questions.map((q) => ({
      id: q.id,
      name: q.id.toUpperCase(),
      latency: q.metrics.latency,
      retrieval: q.metrics.retrievalTime,
      rerank: q.metrics.rerankTime,
      tokens: q.metrics.tokensUsed,
      question: q.question,
    }));
  }, []);

  const selectedQuestion = useMemo(() => {
    return ragDb.questions.find((q) => q.id === activeQuestionId) || ragDb.questions[0] || null;
  }, [activeQuestionId]);

  // Calculate dynamic ratios for the selected question or default average
  const performanceRatios = useMemo(() => {
    if (!selectedQuestion) {
      const retRatio = stats.avgLatency > 0 ? Math.round((stats.avgRetrieval / stats.avgLatency) * 100) : 0;
      const rerRatio = stats.avgLatency > 0 ? Math.round((stats.avgRerank / stats.avgLatency) * 100) : 0;
      return {
        retrievalRatio: retRatio,
        rerankRatio: rerRatio,
        llmRatio: Math.max(0, 100 - retRatio - rerRatio),
      };
    }

    const { latency, retrievalTime, rerankTime } = selectedQuestion.metrics;
    const retRatio = latency > 0 ? Math.round((retrievalTime / latency) * 100) : 0;
    const rerRatio = latency > 0 ? Math.round((rerankTime / latency) * 100) : 0;
    return {
      retrievalRatio: retRatio,
      rerankRatio: rerRatio,
      llmRatio: Math.max(0, 100 - retRatio - rerRatio),
    };
  }, [selectedQuestion, stats]);

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full bg-canvas">
      <div className="flex items-center justify-between border-b-4 border-border-pencil pb-4">
        <div>
          <h1 className="text-4xl">Độ Chính Xác & Hiệu Năng</h1>
          <p className="text-slate-500 text-lg font-bold italic">
            Phân tích thời gian thực dữ liệu thống kê tính toán từ tệp RAG Database thực tế.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <div className="sketch-box-irregular bg-surface pl-10 pr-6 py-2 rounded-xl text-xs font-black text-ink select-none rotate-[-1deg] shadow-sm flex items-center border-2 border-border-pencil">
              <Database size={14} className="text-medical-blue mr-2" />
              CSDL: RAG_DATABASE.JSON
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Performance Indicators (computed live) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricBox 
          icon={Zap} 
          label="Độ trễ trung bình" 
          value={`${stats.avgLatency}ms`} 
          subText={`Truy xuất: ${stats.avgRetrieval}ms | Rerank: ${stats.avgRerank}ms`}
        />
        <MetricBox 
          icon={TrendingUp} 
          label="Tổng phân đoạn RAG" 
          value={`${stats.totalDocs}`} 
          subText="Các mảnh tài liệu đã lập chỉ mục"
        />
        <MetricBox 
          icon={Cpu} 
          label="Tổng câu hỏi đánh giá" 
          value={`${stats.totalQuestions}`} 
          subText="Hồ sơ Benchmark lâm sàng mẫu"
        />
        <MetricBox 
          icon={BarChart3} 
          label="Token Trung Bình" 
          value={`${stats.avgTokens}`} 
          subText="Mật độ ngữ cảnh đầu vào tối ưu"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Metric Chart Panel */}
        <div className="sketch-box p-8 bg-white rotate-[0.5deg] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8 border-b border-dashed border-border-pencil/20 pb-4">
              <h3 className="font-display text-xl text-ink underline decoration-marker decoration-4">
                Biểu đồ hiệu năng đánh giá
              </h3>
              <div className="flex bg-canvas p-1 rounded-lg border border-border-pencil/30 text-xs font-bold">
                <button
                  onClick={() => setSelectedMetricType('latency')}
                  className={`px-3 py-1 rounded-md transition-all text-[10px] uppercase tracking-wider ${
                    selectedMetricType === 'latency'
                      ? 'bg-ink text-white font-extrabold'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  Độ trễ (ms)
                </button>
                <button
                  onClick={() => setSelectedMetricType('tokens')}
                  className={`px-3 py-1 rounded-md transition-all text-[10px] uppercase tracking-wider ${
                    selectedMetricType === 'tokens'
                      ? 'bg-ink text-white font-extrabold'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  Tokens sử dụng
                </button>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {selectedMetricType === 'latency' ? (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b55631a" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }} 
                    />
                    <Tooltip 
                      contentStyle={{ border: '2px solid #4b5563', borderRadius: '8px', background: '#fffdfa', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Area type="monotone" name="Độ trễ Tổng cộng" dataKey="latency" stroke="#4b5563" strokeWidth={3} fillOpacity={0.15} fill="#99f6e4" />
                    <Area type="monotone" name="Thời gian Rerank" dataKey="rerank" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.1} fill="#dbeafe" />
                    <Area type="monotone" name="Thời gian Truy xuất" dataKey="retrieval" stroke="#10b981" strokeWidth={2} fillOpacity={0.1} fill="#d1fae5" />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b55631a" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={{ stroke: '#4b5563', strokeWidth: 2 }} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 'bold' }} 
                    />
                    <Tooltip 
                      contentStyle={{ border: '2px solid #4b5563', borderRadius: '8px', background: '#fffdfa', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar name="Tổng số Tokens" dataKey="tokens" fill="#facc15" stroke="#4b5563" strokeWidth={2} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-border-pencil/20 text-xs text-slate-400 font-bold italic flex items-center gap-1">
            <Sparkles size={12} className="text-medical-blue animate-pulse" />
            Nhấp chọn các câu hỏi cụ thể ở bảng bên phải để phân tích chi tiết lát cắt dữ liệu.
          </div>
        </div>

        {/* Dynamic Health Indicators & Metrics Split */}
        <div className="sketch-box-irregular p-8 bg-white rotate-[-0.5deg] space-y-6">
          <div className="flex items-center justify-between border-b border-dashed border-border-pencil/20 pb-4">
            <h3 className="font-display text-xl text-ink underline decoration-marker decoration-4">
              Phân tích lát cắt: {selectedQuestion ? selectedQuestion.id.toUpperCase() : 'Tất cả'}
            </h3>
            <span className="text-[10px] font-black bg-medical-blue/10 text-medical-blue border border-medical-blue/30 px-2 py-0.5 rounded uppercase">
              {selectedQuestion ? 'CƠ CHẾ LÂM SÀNG' : 'ĐỒNG NHẤT HỆ THỐNG'}
            </span>
          </div>

          {selectedQuestion ? (
            <div className="space-y-4">
              <div className="bg-canvas p-4 rounded-lg border-2 border-border-pencil/40 text-xs">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CÂU HỎI TRUY VẤN</div>
                <p className="text-ink font-bold leading-relaxed">{selectedQuestion.question}</p>
              </div>

              <div className="space-y-4 pt-2">
                <HealthIndicator 
                  label="Tỉ trọng Truy xuất vector" 
                  value={performanceRatios.retrievalRatio} 
                  subLabel={`${selectedQuestion.metrics.retrievalTime}ms`} 
                />
                <HealthIndicator 
                  label="Tỉ trọng Rerank (Cross-Encoder)" 
                  value={performanceRatios.rerankRatio} 
                  subLabel={`${selectedQuestion.metrics.rerankTime}ms`} 
                />
                <HealthIndicator 
                  label="Tỉ trọng Phản hồi LLM chẩn đoán" 
                  value={performanceRatios.llmRatio} 
                  subLabel={`${selectedQuestion.metrics.latency - selectedQuestion.metrics.retrievalTime - selectedQuestion.metrics.rerankTime}ms`} 
                />
              </div>

              <div className="pt-4 flex items-center justify-between text-xs font-bold text-slate-500 border-t border-dashed border-border-pencil/20">
                <span>Tổng độ trễ quy trình RAG:</span>
                <span className="text-md text-ink font-extrabold">{selectedQuestion.metrics.latency}ms</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 font-bold italic">
              Không tìm thấy câu hỏi đo lường nào.
            </div>
          )}
        </div>
      </div>

      {/* Live Data Split: RAG Data Sources & Question Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* 1. Document Source Proportions */}
        <div className="sketch-box p-6 bg-white lg:col-span-1 rotate-[-1deg] border-2 border-border-pencil">
          <div className="flex items-center gap-2 mb-6 text-sm font-black text-slate-400 uppercase tracking-wider border-b border-dashed border-border-pencil/20 pb-3">
            <FileText size={16} className="text-medical-blue" />
            <span>Mật độ phân bổ tệp dữ liệu gốc</span>
          </div>

          <div className="space-y-4">
            {stats.sources.map((src) => (
              <div key={src.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-ink">
                  <span className="truncate max-w-[180px] underline decoration-border-pencil/30" title={src.name}>
                    {src.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {src.count} đoạn ({src.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full border border-border-pencil p-[1px] rounded bg-canvas overflow-hidden">
                  <div className="h-full bg-medical-blue rounded" style={{ width: `${src.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Interactive QA List */}
        <div className="sketch-box-irregular p-6 bg-white lg:col-span-2 rotate-[0.5deg] border-2 border-border-pencil">
          <div className="flex items-center justify-between mb-6 border-b border-dashed border-border-pencil/20 pb-3">
            <div className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-wider">
              <Layers size={16} className="text-medical-blue" />
              <span>Danh mục câu hỏi kiểm thử hệ thống</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">TOTAL: {stats.totalQuestions} QUEs</span>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
            {ragDb.questions.map((q) => {
              const isActive = q.id === activeQuestionId;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-marker/20 border-border-pencil shadow-sm'
                      : 'bg-canvas/50 border-transparent hover:bg-canvas hover:border-border-pencil/20'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={`w-8 h-8 rounded border-2 flex items-center justify-center text-[10px] font-black font-mono shrink-0 ${
                      isActive ? 'bg-ink text-white border-ink' : 'bg-white border-border-pencil text-slate-400'
                    }`}>
                      {q.id.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-ink truncate leading-relaxed">
                      {q.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-right pl-4">
                    <div>
                      <div className="text-xs font-black text-ink">{q.metrics.latency}ms</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">ĐỘ TRỄ</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-ink">{q.metrics.tokensUsed}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">TOKENS</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

function MetricBox({ icon: Icon, label, value, subText }: any) {
  return (
    <div className="sketch-box-irregular p-6 bg-white rotate-[1deg] hover:rotate-0 transition-transform border-2 border-border-pencil">
      <div className="w-12 h-12 border-2 border-border-pencil rounded-xl flex items-center justify-center mb-4 bg-marker shadow-sm rotate-[-3deg]">
        <Icon size={24} className="text-ink" />
      </div>
      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{label}</div>
      <div className="text-3xl font-display text-ink mt-2 mb-1.5 font-black">{value}</div>
      <p className="text-[10px] text-slate-500 font-bold italic truncate leading-none">{subText}</p>
    </div>
  );
}

function HealthIndicator({ label, value, subLabel }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-ink font-black">
          {value}% <span className="text-[10px] font-mono text-slate-400 font-normal">({subLabel})</span>
        </span>
      </div>
      <div className="h-3 w-full border border-border-pencil p-[1px] rounded bg-canvas overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className="h-full bg-medical-blue rounded"
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

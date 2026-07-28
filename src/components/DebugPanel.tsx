import { useState } from 'react';
import { BarChart3, Code, Copy, Search } from 'lucide-react';
import { DebugTab, Metrics, RetrievalResult } from '../types';
import { useApp } from '../context/AppContext';

interface DebugPanelProps {
  retrievalResults: RetrievalResult[];
  prompt: string;
  metrics: Metrics;
}

export default function DebugPanel({ retrievalResults, prompt, metrics }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<DebugTab>('retrieval');
  const [selectedResult, setSelectedResult] = useState<RetrievalResult | null>(null);
  const { settings, config } = useApp();

  const tabs = [
    { id: 'retrieval' as const, label: 'Evidence', icon: Search },
    { id: 'prompt' as const, label: 'Prompt', icon: Code },
    { id: 'metrics' as const, label: 'Metrics', icon: BarChart3 },
  ];

  return (
    <aside className="w-[420px] border-l-2 border-border-pencil bg-surface/40 flex flex-col h-screen overflow-hidden">
      <div className="p-5 border-b-2 border-border-pencil bg-surface">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-ink">RAG Inspector</h2>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              {settings.ragMethod} · {settings.reranker === 'jina-reranker-v2' ? 'Jina rerank' : 'No rerank'} · Top-{settings.topK}
            </p>
          </div>
          <span className="px-2 py-1 rounded border border-border-pencil/30 bg-canvas text-[9px] font-mono text-slate-500">
            {settings.ragMethod === 'bm25' ? 'lexical' : config.embedding}
          </span>
        </div>
      </div>

      <div className="flex border-b-2 border-border-pencil bg-surface px-3 pt-2 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-wider rounded-t-lg ${
              activeTab === id ? 'bg-marker/40 text-ink border-2 border-border-pencil border-b-0' : 'text-slate-400'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'retrieval' && (
          <div className="space-y-4">
            {retrievalResults.length === 0 ? (
              <EmptyState text="Gửi một câu hỏi để xem evidence được truy xuất." />
            ) : retrievalResults.map((result, index) => (
              <button
                type="button"
                key={result.id}
                onClick={() => setSelectedResult(result)}
                className="w-full text-left p-4 bg-surface border-2 border-border-pencil rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="w-7 h-7 shrink-0 rounded-md bg-marker/30 border border-border-pencil flex items-center justify-center text-xs font-black">
                    #{index + 1}
                  </span>
                  <div className="text-right">
                    <span className="block font-mono text-sm font-black text-medical-blue">
                      {formatEvidenceScore(result, settings.ragMethod)}
                    </span>
                    <span className="block text-[8px] uppercase tracking-wider font-black text-slate-400">
                      {result.rerankScore !== undefined ? 'Jina score' : retrievalLabel(settings.ragMethod)}
                    </span>
                  </div>
                </div>
                <p className="text-xs font-bold text-ink truncate mb-2">{result.source}</p>
                <p className="text-xs leading-relaxed text-slate-600 line-clamp-4">{result.content}</p>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'prompt' && (
          prompt ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(prompt)}
                className="absolute right-3 top-3 p-2 bg-surface border border-border-pencil rounded-md"
                title="Sao chép prompt"
              >
                <Copy size={13} />
              </button>
              <pre className="whitespace-pre-wrap break-words p-5 pr-12 bg-ink text-slate-100 rounded-xl text-[11px] leading-relaxed font-mono">
                {prompt}
              </pre>
            </div>
          ) : <EmptyState text="Prompt thật sẽ xuất hiện sau truy vấn đầu tiên." />
        )}

        {activeTab === 'metrics' && (
          metrics.latency > 0 ? (
            <div className="space-y-5">
              {metrics.evaluationAvailable ? (
                <>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-3">
                      Score của câu hỏi hiện tại
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <MetricCard label="Token F1" value={formatUnitMetric(metrics.tokenF1)} />
                      <MetricCard
                        label="Semantic cosine"
                        value={formatUnitMetric(metrics.semanticSimilarity)}
                        hint={metrics.semanticModel || undefined}
                      />
                      <MetricCard label="Recall@5" value={formatUnitMetric(metrics.recallAt5)} />
                      <MetricCard label="MRR" value={formatUnitMetric(metrics.mrr)} />
                    </div>
                    <p className="mt-3 text-[10px] text-slate-500 font-bold">
                      Evidence đúng trong Top-5: {metrics.relevantRetrieved}/{metrics.relevantTotal}.
                      Ground truth chỉ dùng sau khi model trả lời.
                    </p>
                  </div>
                </>
              ) : (
                <EmptyState text="Không tìm thấy câu hỏi trùng khớp trong Vi-HERMES nên không thể chấm F1/Recall." />
              )}
              <div>
                <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-3">
                  Runtime
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard label="Tổng latency" value={`${metrics.latency} ms`} />
                  <MetricCard label="Retrieval" value={`${metrics.retrievalTime} ms`} />
                  <MetricCard label="Reranker" value={`${metrics.rerankTime} ms`} />
                  <MetricCard label="Generation" value={`${metrics.generationTime} ms`} />
                  <MetricCard label="Evaluation" value={`${metrics.evaluationTime} ms`} />
                  <MetricCard label="Tokens" value={metrics.tokensUsed.toLocaleString('vi-VN')} />
                </div>
              </div>
            </div>
          ) : <EmptyState text="Metrics runtime sẽ xuất hiện sau truy vấn đầu tiên." />
        )}
      </div>

      {selectedResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface border-2 border-border-pencil rounded-2xl max-w-2xl w-full p-8 shadow-xl">
            <div className="flex justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Evidence detail</p>
                <h3 className="font-display text-xl text-ink">{selectedResult.source}</h3>
              </div>
              <button type="button" onClick={() => setSelectedResult(null)} className="text-2xl">×</button>
            </div>
            <p className="p-5 bg-canvas rounded-xl text-sm leading-relaxed max-h-[360px] overflow-y-auto">
              {selectedResult.content}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-marker/20 rounded text-[10px] font-bold">
                {selectedResult.rerankScore !== undefined ? 'Jina reranker' : retrievalLabel(settings.ragMethod)}:{' '}
                {formatEvidenceScore(selectedResult, settings.ragMethod)}
              </span>
              {Object.entries(selectedResult.metadata).map(([key, value]) => (
                <span key={key} className="px-2 py-1 bg-canvas rounded text-[10px] font-bold">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function retrievalLabel(method: 'bm25' | 'dense' | 'hybrid') {
  return method === 'bm25' ? 'BM25 raw' : method === 'dense' ? 'cosine' : 'weighted RRF';
}

function formatRetrievalScore(score: number, method: 'bm25' | 'dense' | 'hybrid') {
  return method === 'dense' ? `${(score * 100).toFixed(2)}%` : score.toFixed(method === 'bm25' ? 3 : 4);
}

function formatEvidenceScore(
  result: RetrievalResult,
  method: 'bm25' | 'dense' | 'hybrid',
) {
  if (result.rerankScore !== undefined) return result.rerankScore.toFixed(4);
  return formatRetrievalScore(result.score, method);
}

function formatUnitMetric(value: number | null) {
  return value === null ? 'N/A' : value.toFixed(4);
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-8 border-2 border-dashed border-border-pencil/30 rounded-xl text-center text-xs font-bold text-slate-400">
      {text}
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-4 bg-surface border-2 border-border-pencil rounded-xl">
      <div className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-2">{label}</div>
      <div className="text-lg font-display text-ink break-words">{value}</div>
      {hint && <div className="mt-1 text-[8px] font-mono text-slate-400 break-all">{hint}</div>}
    </div>
  );
}

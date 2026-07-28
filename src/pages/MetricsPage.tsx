import { Award, Database, FileCheck2 } from 'lucide-react';

interface BenchmarkRow {
  prompting: 'Zero-Shot' | 'Few-Shot' | 'CoT';
  strategy: 'Dense' | 'BM25' | 'Hybrid';
  embedding: string;
  reranker: string;
  f1: number;
  bert: number;
  recall: number;
  marks?: Partial<Record<'f1' | 'bert' | 'recall', 'best' | 'runner'>>;
}

const RESULTS: BenchmarkRow[] = [
  { prompting: 'Zero-Shot', strategy: 'Dense', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.4187, bert: 0.7522, recall: 0.6919 },
  { prompting: 'Zero-Shot', strategy: 'Dense', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4892, bert: 0.7820, recall: 0.9013 },
  { prompting: 'Zero-Shot', strategy: 'Dense', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4219, bert: 0.7521, recall: 0.7303 },
  { prompting: 'Zero-Shot', strategy: 'BM25', embedding: '—', reranker: 'BGE-v2-m3', f1: 0.4897, bert: 0.7816, recall: 0.9097 },
  { prompting: 'Zero-Shot', strategy: 'Hybrid', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.4892, bert: 0.7817, recall: 0.8975 },
  { prompting: 'Zero-Shot', strategy: 'Hybrid', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4918, bert: 0.7830, recall: 0.9116, marks: { f1: 'runner', bert: 'runner' } },
  { prompting: 'Zero-Shot', strategy: 'Hybrid', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4897, bert: 0.7820, recall: 0.9020 },

  { prompting: 'Few-Shot', strategy: 'Dense', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.3700, bert: 0.7195, recall: 0.4509 },
  { prompting: 'Few-Shot', strategy: 'Dense', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4088, bert: 0.7356, recall: 0.9121 },
  { prompting: 'Few-Shot', strategy: 'Dense', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4130, bert: 0.7374, recall: 0.8999 },
  { prompting: 'Few-Shot', strategy: 'BM25', embedding: '—', reranker: 'BGE-v2-m3', f1: 0.4059, bert: 0.7343, recall: 0.9153, marks: { recall: 'runner' } },
  { prompting: 'Few-Shot', strategy: 'Hybrid', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.3883, bert: 0.7273, recall: 0.8467 },
  { prompting: 'Few-Shot', strategy: 'Hybrid', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.4462, bert: 0.7524, recall: 0.9183, marks: { recall: 'best' } },
  { prompting: 'Few-Shot', strategy: 'Hybrid', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.4067, bert: 0.7350, recall: 0.9102 },

  { prompting: 'CoT', strategy: 'Dense', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.5006, bert: 0.7902, recall: 0.6944 },
  { prompting: 'CoT', strategy: 'Dense', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.5717, bert: 0.8166, recall: 0.9033, marks: { f1: 'runner' } },
  { prompting: 'CoT', strategy: 'Dense', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.5710, bert: 0.8158, recall: 0.8872 },
  { prompting: 'CoT', strategy: 'BM25', embedding: '—', reranker: 'BGE-v2-m3', f1: 0.5717, bert: 0.8163, recall: 0.9090, marks: { f1: 'runner' } },
  { prompting: 'CoT', strategy: 'Hybrid', embedding: 'nomic-text', reranker: 'BGE-v2-m3', f1: 0.5715, bert: 0.8154, recall: 0.8981 },
  { prompting: 'CoT', strategy: 'Hybrid', embedding: 'bge-m3', reranker: 'BGE-v2-m3', f1: 0.5774, bert: 0.8179, recall: 0.9129, marks: { f1: 'best', bert: 'best' } },
  { prompting: 'CoT', strategy: 'Hybrid', embedding: 'mE5', reranker: 'BGE-v2-m3', f1: 0.5740, bert: 0.8175, recall: 0.9065 },
];

export default function MetricsPage() {
  return (
    <div className="p-10 overflow-y-auto h-full bg-canvas">
      <div className="border-b-4 border-border-pencil pb-5 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">Offline evaluation</p>
        <h1 className="text-4xl text-medical-blue font-display">VectorRAG · ViHERMES Benchmark</h1>
        <p className="text-slate-500 mt-2 font-medium">
          Kết quả toàn diện trên tập ViHERMES. Đây là số liệu benchmark offline, tách biệt với metric của từng câu hỏi trong RAG Inspector.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <SummaryCard icon={Database} label="Cấu hình" value="21 runs" />
        <SummaryCard icon={FileCheck2} label="Best F1 / BERT" value="CoT · Hybrid" />
        <SummaryCard icon={Award} label="Best Recall@5" value="0.9183" />
      </div>

      <div className="overflow-x-auto border-2 border-border-pencil rounded-xl bg-surface">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-ink text-white text-[10px] uppercase tracking-widest">
            <tr>
              <th className="p-3">Prompting</th>
              <th className="p-3">Strategy</th>
              <th className="p-3">Embedding</th>
              <th className="p-3">Reranker</th>
              <th className="p-3 text-right">F1</th>
              <th className="p-3 text-right">BERTScore</th>
              <th className="p-3 text-right">Recall@5</th>
            </tr>
          </thead>
          <tbody>
            {RESULTS.map((result, index) => {
              const startsGroup = index === 0 || RESULTS[index - 1].prompting !== result.prompting;
              return (
                <tr
                  key={`${result.prompting}-${result.strategy}-${result.embedding}`}
                  className={`${startsGroup ? 'border-t-4' : 'border-t'} border-border-pencil/20`}
                >
                  <td className="p-3">
                    {startsGroup && (
                      <span className="inline-flex px-2 py-1 rounded-md bg-marker/30 border border-border-pencil text-[10px] font-black uppercase">
                        {result.prompting}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-display">{result.strategy}</td>
                  <td className="p-3 font-mono text-xs">{result.embedding}</td>
                  <td className="p-3 font-mono text-xs">{result.reranker}</td>
                  <MetricCell value={result.f1} mark={result.marks?.f1} />
                  <MetricCell value={result.bert} mark={result.marks?.bert} />
                  <MetricCell value={result.recall} mark={result.marks?.recall} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-5 bg-marker/15 border-2 border-dashed border-border-pencil/40 rounded-xl text-sm text-slate-600">
        <strong>In đậm</strong>: tốt nhất toàn bảng. <span className="underline underline-offset-4">Gạch chân</span>: kết quả nổi bật kế tiếp theo bảng báo cáo.
        Bảng trên là benchmark offline với Ollama/BGE. Web Playground dùng Gemini và Jina APIs để minh họa pipeline tương tác; số liệu runtime không được xem là benchmark tương đương.
      </div>
    </div>
  );
}

function MetricCell({ value, mark }: { value: number; mark?: 'best' | 'runner' }) {
  return (
    <td className={`p-3 text-right font-mono ${mark === 'best' ? 'font-black text-medical-blue' : ''} ${mark === 'runner' ? 'underline underline-offset-4 decoration-2' : ''}`}>
      {value.toFixed(4)}
    </td>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-5 bg-surface border-2 border-border-pencil rounded-xl flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-marker/30 border border-border-pencil flex items-center justify-center">
        <Icon size={19} />
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-widest font-black text-slate-400">{label}</p>
        <p className="font-display text-xl text-ink">{value}</p>
      </div>
    </div>
  );
}

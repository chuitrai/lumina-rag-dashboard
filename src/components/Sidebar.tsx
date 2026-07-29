/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  SlidersHorizontal,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { PROMPT_PRESETS } from '../config/promptPresets';
import { useApp } from '../context/AppContext';
import { Page } from '../types';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activePage, setActivePage, config, setConfig, settings, setSettings } = useApp();

  const menuItems: { id: Page; label: string; icon: any }[] = [
    { id: 'chat', label: 'RAG Playground', icon: MessageSquare },
    { id: 'metrics', label: 'Benchmark', icon: BarChart3 },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 260 }}
      className="h-screen bg-canvas border-r-2 border-border-pencil flex flex-col relative z-20"
    >
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 border-2 border-border-pencil rounded-lg flex items-center justify-center shrink-0 rotate-3 shadow-sm bg-surface">
          <HeartPulse className="w-6 h-6 text-medical-blue" />
        </div>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-2xl text-medical-blue tracking-tight"
          >
            ViHERMES RAG
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-3 border-b border-border-pencil/20 pb-1">
          {!isCollapsed ? 'MEDICAL RAG DEMO' : '...'}
        </div>
        {menuItems.map((item) => (
          <Fragment key={item.id}>
            <button
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-4 px-3 py-3 transition-all relative group ${
                activePage === item.id
                  ? 'text-ink scale-105'
                  : 'text-slate-500 hover:text-ink hover:translate-x-1'
              }`}
            >
              {activePage === item.id && (
                <motion.div
                  layoutId="active-marker"
                  className="absolute inset-0 bg-marker/40 -z-10"
                  style={{ borderRadius: '2% 5% 5% 2% / 5% 2% 2% 5%' }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon className={`w-5 h-5 shrink-0 ${activePage === item.id ? 'stroke-[2.5px]' : 'stroke-2 opacity-70 group-hover:opacity-100'}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-lg transition-all ${activePage === item.id ? 'font-bold' : 'font-medium'}`}
                >
                  {item.label}
                </motion.span>
              )}
            </button>

            {item.id === 'chat' && activePage === 'chat' && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mx-2 mb-3 mt-1 p-3 space-y-3 bg-surface/70 border-2 border-border-pencil rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-border-pencil/20">
                  <SlidersHorizontal size={13} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pipeline Config</span>
                </div>

                <SidebarSelect
                  label="Strategy"
                  value={settings.ragMethod}
                  onChange={(value) => setSettings((current) => ({ ...current, ragMethod: value as typeof current.ragMethod }))}
                  options={[
                    ['bm25', 'BM25'],
                    ['dense', 'Dense Vector'],
                    ['hybrid', 'Hybrid RRF'],
                  ]}
                />

                {settings.ragMethod !== 'bm25' && (
                  <SidebarSelect
                    label="Embedding"
                    value={config.embedding}
                    onChange={(value) => setConfig((current) => ({ ...current, embedding: value }))}
                    options={[
                      ['jina-embeddings-v3', 'Jina Embeddings v3'],
                    ]}
                  />
                )}

                <SidebarSelect
                  label="Reranker"
                  value={settings.reranker}
                  onChange={(value) => setSettings((current) => ({
                    ...current,
                    reranker: value as typeof current.reranker,
                  }))}
                  options={[
                    ['none', 'Không rerank (mặc định)'],
                    ['jina-reranker-v2', 'Jina Reranker v2 · Cần JINA_API_KEY'],
                  ]}
                />

                <SidebarSelect
                  label="Prompting"
                  value={settings.promptPreset}
                  onChange={(value) => setSettings((current) => ({ ...current, promptPreset: value as typeof current.promptPreset }))}
                  options={Object.entries(PROMPT_PRESETS)
                    .map(([id, preset]) => [id, preset.label] as [string, string])}
                />

                <SidebarSelect
                  label="Generator"
                  value={config.llm}
                  onChange={(value) => setConfig((current) => ({ ...current, llm: value }))}
                  options={[
                    ['llama3.2:1b', 'Ollama: llama3.2:1b (Mặc định)'],
                    ['qwen3:8b', 'Ollama: qwen3:8b'],
                    ['llama3:8b', 'Ollama: llama3:8b'],
                    ['mistral:7b', 'Ollama: mistral:7b'],
                  ]}
                />

                <div className="p-2 bg-canvas border border-dashed border-border-pencil/40 rounded-lg">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Context depth</span>
                  <span className="block mt-1 text-[10px] font-bold text-ink">Top-5 evidence</span>
                  <span className="block mt-1 text-[8px] leading-relaxed text-slate-400">
                    Cố định theo pipeline benchmark.
                  </span>
                </div>
              </motion.div>
            )}
          </Fragment>
        ))}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-7 h-7 bg-surface border-2 border-border-pencil shadow-sm rounded-full flex items-center justify-center text-ink hover:bg-marker z-30 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}

function SidebarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block mb-1 text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full p-2 bg-canvas text-ink border-2 border-border-pencil rounded-lg text-[10px] font-bold outline-none"
      >
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

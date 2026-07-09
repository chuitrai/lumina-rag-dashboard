/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, RotateCcw, ThumbsUp, ThumbsDown, Copy, Activity, Layers } from 'lucide-react';
import { Message } from '../types';
import Markdown from 'react-markdown';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onRetry?: (id: string) => void;
  isStreaming: boolean;
}

import { useApp } from '../context/AppContext';
import { ChevronDown, Check, Sun, Moon } from 'lucide-react';

const MODELS = {
  llm: [
    { id: 'qwen3:8b', name: 'Ollama: qwen3:8b (Mặc định)' },
    { id: 'llama3:8b', name: 'Ollama: llama3:8b' },
    { id: 'mistral:7b', name: 'Ollama: mistral:7b' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Kế thừa)' },
  ],
  embedding: [
    { id: 'bge', name: 'bge' },
    { id: 'vietnamese-sbert', name: 'vietnamese-sbert' },
    { id: 'mE5-large', name: 'mE5-large' },
  ],
  reranker: [
    { id: 'bge-large', name: 'bge-large' },
    { id: 'colBERT', name: 'colBERT' },
    { id: 'PhoRanker', name: 'PhoRanker' },
  ]
};

export default function ChatContainer({ messages, onSendMessage, onRetry, isStreaming }: ChatContainerProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { config, setConfig, settings, setSettings, activeMetrics } = useApp();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ModelDropdown = ({ type, current, options }: { type: keyof typeof MODELS, current: string, options: any[] }) => (
    <div className="relative">
      <button 
        onClick={() => setOpenDropdown(openDropdown === type ? null : type)}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-border-pencil rounded-lg text-[10px] font-bold text-ink hover:bg-marker/30 transition-all uppercase tracking-wider bg-surface shadow-sm rotate-[-1deg]"
      >
        <span className="text-slate-500">{type === 'llm' ? 'Suy Luận' : type === 'embedding' ? 'Nhúng Vector' : 'Tái Xếp Hạng'}:</span>
        {options.find(o => o.id === current)?.name}
        <ChevronDown size={12} className={`transition-transform ${openDropdown === type ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {openDropdown === type && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-full left-0 mt-2 w-52 sketch-box z-40 p-2 overflow-hidden rotate-[1deg]"
            >
              {options.map((opt) => {
                const isLocked = false;
                return (
                  <button
                    key={opt.id}
                    disabled={isLocked}
                    onClick={() => {
                      if (isLocked) return;
                      setConfig(prev => ({ ...prev, [type]: opt.id }));
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                      current === opt.id 
                        ? 'bg-marker text-ink' 
                        : isLocked
                          ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/50'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {opt.name}
                      {isLocked && (
                        <span className="text-[8px] bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-1 py-0.5 rounded font-black tracking-wider border border-red-200 dark:border-red-900">
                          KHOÁ
                        </span>
                      )}
                    </span>
                    {current === opt.id && <Check size={14} className="stroke-[3px]" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-canvas relative">
      <header className="px-8 h-20 border-b-2 border-border-pencil flex items-center justify-between bg-canvas sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-marker text-ink border-2 border-border-pencil rounded-full text-[10px] font-bold uppercase tracking-widest rotate-[-1deg]">
            <div className="w-2 h-2 bg-medical-blue rounded-full animate-pulse" />
            TRA CỨU PHÁP QUY VIHERMES ĐANG HOẠT ĐỘNG
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
            className="w-10 h-10 border-2 border-border-pencil rounded-lg flex items-center justify-center bg-marker hover:bg-marker/60 transition-all rotate-3 shadow-sm group"
          >
            {settings.theme === 'light' ? <Moon size={20} className="text-ink" /> : <Sun size={20} className="text-ink" />}
          </button>
          <ModelDropdown type="llm" current={config.llm} options={MODELS.llm} />
          <ModelDropdown type="embedding" current={config.embedding} options={MODELS.embedding} />
          <ModelDropdown type="reranker" current={config.reranker} options={MODELS.reranker} />
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`flex gap-6 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 border-2 border-border-pencil rounded-lg flex items-center justify-center shrink-0 shadow-sm rotate-[1deg] ${
                message.role === 'user' ? 'bg-surface text-ink' : 'bg-medical-blue text-white'
              }`}>
                {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[75%] space-y-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`sketch-bubble text-lg font-medium leading-relaxed group relative pb-3 ${
                  message.role === 'user' 
                    ? 'border-border-pencil bg-marker rotate-[-0.5deg]' 
                    : 'border-border-pencil bg-surface rotate-[0.5deg]'
                }`}>
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  ) : (
                    <div className="markdown-body text-left break-words">
                      <Markdown
                        components={{
                          h1: ({ children }) => <h1 className="text-xl font-black my-3 border-b-2 border-dashed border-border-pencil/20 pb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-black my-2.5">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold my-2">{children}</h3>,
                          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed font-medium">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1 font-medium">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1 font-medium">{children}</ol>,
                          li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
                          code: ({ children }) => <code className="bg-canvas px-1.5 py-0.5 rounded text-xs font-mono border border-border-pencil/30 text-medical-blue font-bold">{children}</code>,
                          strong: ({ children }) => <strong className="font-black text-ink underline decoration-marker/50 decoration-2">{children}</strong>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-medical-blue pl-4 py-1 my-3 bg-canvas/40 italic font-medium text-slate-600 rounded-r-lg">{children}</blockquote>
                        }}
                      >
                        {message.content}
                      </Markdown>
                    </div>
                  )}
                  <div className={`text-[9px] font-bold opacity-30 mt-1 uppercase tracking-widest ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="absolute -bottom-10 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-canvas/80 backdrop-blur-sm p-1 rounded-lg border border-border-pencil/20">
                      <button 
                        onClick={() => handleCopy(message.content, message.id)}
                        className={`p-1.5 border-2 border-border-pencil bg-surface rounded-md hover:bg-marker transition-colors shadow-sm ${copiedId === message.id ? 'text-green-600' : 'text-slate-500'}`}
                        title="Sao chép chẩn đoán"
                      >
                        <Copy size={12} />
                      </button>
                      <button 
                        onClick={() => onRetry?.(message.id)}
                        className="p-1.5 border-2 border-border-pencil bg-surface rounded-md hover:bg-marker transition-colors shadow-sm text-slate-500"
                        title="Tạo lại phản hồi"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <div className="w-[1px] h-4 bg-border-pencil/20 mx-1" />
                      <button 
                        className="p-1.5 border-2 border-border-pencil bg-surface rounded-md hover:bg-marker transition-colors shadow-sm text-slate-500 hover:text-green-600"
                        title="Chẩn đoán chính xác"
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button 
                        className="p-1.5 border-2 border-border-pencil bg-surface rounded-md hover:bg-marker transition-colors shadow-sm text-slate-500 hover:text-red-500"
                        title="Chẩn đoán chưa chính xác"
                      >
                        <ThumbsDown size={12} />
                      </button>
                      {copiedId === message.id && <span className="text-[10px] font-black text-green-600 ml-1">ĐÃ SAO CHÉP!</span>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-6"
          >
            <div className="w-10 h-10 border-2 border-border-pencil bg-border-pencil text-white flex items-center justify-center shrink-0 rounded-lg rotate-[-2deg]">
              <Bot size={20} />
            </div>
            <div className="max-w-[75%] space-y-2">
              <div className="sketch-bubble bg-surface p-4 flex items-center gap-2">
                <motion.div className="w-2 h-2 bg-border-pencil rounded-full" animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                <motion.div className="w-2 h-2 bg-border-pencil rounded-full" animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                <motion.div className="w-2 h-2 bg-border-pencil rounded-full" animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-10 bg-gradient-to-t from-canvas via-canvas to-transparent">
        <div className="max-w-3xl mx-auto w-full">

          <form onSubmit={handleSubmit} className="relative">
            <div className="sketch-box flex items-center p-2 bg-white rotate-[-0.5deg]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tra cứu điều luật, nghị định hoặc câu hỏi y tế pháp lý..."
                disabled={isStreaming}
                className="flex-1 bg-transparent border-none px-6 py-4 text-xl text-ink font-medium placeholder:text-slate-300 outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="bg-medical-blue px-6 py-3 rounded-lg text-white hover:bg-blue-700 transition-all shadow-md disabled:opacity-30 disabled:grayscale rotate-[2deg] flex items-center gap-2 border-2 border-border-pencil"
              >
                <span className="font-display text-lg uppercase">TRA CỨU</span>
                <Send size={18} />
              </button>
            </div>
          </form>
          <div className="mt-8 flex items-center justify-center gap-8">
             <div className="flex items-center gap-3">
               <Sparkles size={16} className="text-medical-blue" />
               <span className="text-xs text-ink font-bold uppercase tracking-widest underline decoration-2 decoration-marker">ĐÃ KÍCH HOẠT HỆ THỐNG VIHERMES RAG</span>
             </div>
             <div className="w-1.5 h-1.5 rounded-full bg-border-pencil/30" />
             <div className="flex items-center gap-3">
               <span className="text-xs text-ink font-bold uppercase tracking-widest italic decoration-2 decoration-border-pencil underline">
                 ĐỘ TRỄ TRUY XUẤT: {activeMetrics.latency > 0 ? `${activeMetrics.latency}ms` : '--- ms'}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

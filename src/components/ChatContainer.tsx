/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, RotateCcw, ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
import { Message } from '../types';
import Markdown from 'react-markdown';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onRetry?: (id: string) => void;
  isStreaming: boolean;
}

import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';

export default function ChatContainer({ messages, onSendMessage, onRetry, isStreaming }: ChatContainerProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { settings, setSettings, activeMetrics } = useApp();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    Promise.all([
      fetch('/api/health').then((response) => {
        if (!response.ok) throw new Error('Backend offline');
        return response.json();
      }),
      fetch('/api/examples?limit=3').then((response) => response.json()),
    ])
      .then(([, examplesResult]) => {
        setBackendStatus('online');
        setExampleQuestions(
          (examplesResult.examples || []).map((example: { question: string }) => example.question),
        );
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

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

  return (
    <div className="flex flex-col h-full bg-canvas relative">
      <header className="px-6 min-h-20 border-b-2 border-border-pencil bg-canvas sticky top-0 z-20 transition-colors flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="shrink-0">
            <h1 className="font-display text-xl text-ink">RAG Playground</h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${backendStatus === 'offline' ? 'text-red-600' : 'text-slate-400'}`}>
              {backendStatus === 'online' ? 'ViHERMES · 1.561 câu hỏi' : backendStatus === 'offline' ? 'Backend offline' : 'Đang kết nối'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
          className="w-10 h-10 border-2 border-border-pencil rounded-lg flex items-center justify-center bg-marker hover:bg-marker/60 transition-all rotate-2 shadow-sm"
          title="Đổi giao diện sáng/tối"
        >
          {settings.theme === 'light' ? <Moon size={18} className="text-ink" /> : <Sun size={18} className="text-ink" />}
        </button>
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
          {exampleQuestions.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {exampleQuestions.map((question, index) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setInput(question)}
                  className="shrink-0 max-w-[240px] truncate px-3 py-1.5 bg-surface border-2 border-border-pencil/60 rounded-lg text-[10px] font-bold text-ink hover:bg-marker/40 transition-colors"
                  title={question}
                >
                  CÂU HỎI DEMO {index + 1}
                </button>
              ))}
            </div>
          )}
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
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>{settings.ragMethod}</span>
            <span>Top-{settings.topK}</span>
            {activeMetrics.latency > 0 && <span>{activeMetrics.latency} ms</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

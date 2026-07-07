/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Search, 
  BarChart3, 
  Settings, 
  Database,
  Layers,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Activity,
  Microscope,
  HeartPulse
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Page } from '../types';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activePage, setActivePage } = useApp();

  const menuItems: { id: Page; label: string; icon: any }[] = [
    { id: 'chat', label: 'Hội Thoại Lâm Sàng', icon: Stethoscope },
    { id: 'retrieval', label: 'Tra Cứu Bệnh Án', icon: Microscope },
    { id: 'datasets', label: 'Dữ Liệu Lâm Sàng', icon: Database },
    { id: 'metrics', label: 'Thống Kê Y Tế', icon: BarChart3 },
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
            VIMEDRAG
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-3 border-b border-border-pencil/20 pb-1">
          {!isCollapsed ? 'NGHIÊN CỨU LÂM SÀNG' : '...'}
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
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
        ))}
      </nav>



      <div className="p-4 border-t-2 border-border-pencil/20 bg-canvas/30">
        <button
          className={`w-full flex items-center gap-4 px-3 py-3 transition-all relative group ${
            activePage === 'settings' 
              ? 'text-ink' 
              : 'text-slate-500 hover:text-ink hover:translate-x-1'
          }`}
          onClick={() => setActivePage('settings')}
        >
           {activePage === 'settings' && (
              <motion.div
                layoutId="active-marker"
                className="absolute inset-0 bg-marker/40 -z-10"
                style={{ borderRadius: '5% 2% 2% 5% / 2% 5% 5% 2%' }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          <Settings className={`w-5 h-5 shrink-0 ${activePage === 'settings' ? 'stroke-[2.5px]' : ''}`} />
          {!isCollapsed && <span className="text-lg font-medium">Cài Đặt</span>}
        </button>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 w-7 h-7 bg-surface border-2 border-border-pencil shadow-sm rounded-full flex items-center justify-center text-ink hover:bg-marker z-30 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}

function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.7l9.6-9.7a1 1 0 0 1 1.7.7v5.3l4.7-.6a1 1 0 0 1 .8 1.6l-9.6 9.7a1 1 0 0 1-1.7-.7v-5.3l-4.7.6a1 1 0 0 1-.8-1.6z" />
    </svg>
  );
}

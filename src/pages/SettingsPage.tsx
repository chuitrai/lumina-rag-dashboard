/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Settings, Moon, Sun, Monitor, ShieldCheck, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { settings, setSettings } = useApp();

  return (
    <div className="p-10 space-y-12 overflow-y-auto h-full max-w-4xl bg-canvas">
      <div className="border-b-4 border-border-pencil pb-4">
        <h1 className="text-4xl text-ink">Cấu Hình Hệ Thống</h1>
        <p className="text-slate-500 text-lg font-bold italic">Tinh chỉnh môi trường nghiên cứu lâm sàng và tham số gỡ lỗi.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-display text-xl text-ink uppercase tracking-widest underline decoration-marker decoration-4">Tùy Chọn Giao Diện</h2>
        <div className="space-y-4">
          <div className="sketch-box-irregular flex items-center justify-between p-6 bg-white rotate-[0.5deg]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-marker text-ink border-2 border-border-pencil rounded-lg rotate-[-2deg]">
                {settings.theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <div className="font-bold text-ink text-lg uppercase tracking-tight">Chế Độ Giao Diện</div>
                <p className="text-sm text-slate-500 font-bold italic">Chuyển đổi giữa chế độ Sáng và Tối.</p>
              </div>
            </div>
            <div className="flex border-2 border-border-pencil p-1 rounded-xl bg-canvas rotate-[1deg]">
              <button 
                onClick={() => setSettings(p => ({ ...p, theme: 'light' }))}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${settings.theme === 'light' ? 'bg-marker text-ink border-2 border-border-pencil shadow-sm' : 'text-slate-400'}`}
              >
                Sáng
              </button>
              <button 
                onClick={() => setSettings(p => ({ ...p, theme: 'dark' }))}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${settings.theme === 'dark' ? 'bg-marker text-ink border-2 border-border-pencil shadow-sm' : 'text-slate-400'}`}
              >
                Tối
              </button>
            </div>
          </div>

          <ToggleControl 
            icon={Monitor}
            label="Bảng Điều Khiển Debug"
            desc="Hiển thị bảng phân tích cấu hình RAG chuyên sâu bao gồm điểm số và phác đồ."
            active={settings.showDebugPanel}
            onToggle={() => setSettings(p => ({ ...p, showDebugPanel: !p.showDebugPanel }))}
          />

          <ToggleControl 
            icon={ShieldCheck}
            label="Giao Thức An Toàn"
            desc="Ngăn chặn các truy vấn có thể không an toàn hoặc không hợp quy chuẩn đến hệ thống."
            active={settings.enableCompareMode}
            onToggle={() => setSettings(p => ({ ...p, enableCompareMode: !p.enableCompareMode }))}
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-xl text-ink uppercase tracking-widest underline decoration-marker decoration-4">Cấu Hình Quy Trình RAG</h2>
        <div className="sketch-box p-8 bg-white rotate-[-0.5deg]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-canvas text-ink border-2 border-border-pencil rounded-lg rotate-3"><Sliders size={20} /></div>
              <div>
                <div className="font-bold text-ink text-lg uppercase tracking-tight">Độ Sâu Top-K</div>
                <p className="text-sm text-slate-500 font-bold italic italic">Xác định số lượng hồ sơ tài liệu tối đa được đưa vào phân tích ngữ cảnh.</p>
              </div>
            </div>
            <span className="text-4xl font-display text-ink underline decoration-marker decoration-8">{settings.topK}</span>
          </div>
          <div className="relative h-8 flex items-center">
             <div className="absolute inset-0 bg-border-pencil/10 rounded-full h-2 my-auto" />
             <input 
              type="range" 
              min="1" 
              max="20" 
              value={settings.topK}
              onChange={(e) => setSettings(p => ({ ...p, topK: parseInt(e.target.value) }))}
              className="w-full relative z-10 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-marker [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:rounded-full" 
            />
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-500 font-black uppercase tracking-widest">
            <span>TỐI THIỂU [1]</span>
            <span className="opacity-30">--- TIÊU CHUẨN [10] ---</span>
            <span>TỐI ĐA [20]</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleControl({ icon: Icon, label, desc, active, onToggle }: any) {
  return (
    <div className="sketch-box-irregular flex items-center justify-between p-6 bg-white rotate-[-0.5deg]">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-canvas text-ink border-2 border-border-pencil rounded-lg rotate-[2deg]"><Icon size={20} /></div>
        <div>
          <div className="font-bold text-ink text-lg uppercase tracking-tight">{label}</div>
          <p className="text-sm text-slate-500 font-bold italic">{desc}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`w-14 h-8 border-2 border-border-pencil rounded-full transition-all relative ${active ? 'bg-marker' : 'bg-canvas'}`}
      >
        <motion.div 
          animate={{ x: active ? 28 : 2 }}
          className="absolute top-1 left-0 w-5 h-5 bg-ink border-2 border-ink rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

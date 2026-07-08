/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Database, Clock, FileText, Plus, X, CheckCircle2, Loader2, Globe, Cloud, Upload } from 'lucide-react';
import { Dataset } from '../types';
import { useState } from 'react';

const MOCK_DATASETS: Dataset[] = [
  { 
    id: '1', 
    name: 'ViHERMES - Luật Khám chữa bệnh & Cấp phép', 
    description: 'Tập hợp các điều khoản Luật Khám bệnh, Chữa bệnh số 15/2023/QH15 và các Nghị định hướng dẫn về điều kiện cấp phép hoạt động, chứng chỉ hành nghề cơ sở y tế.',
    docCount: 624, 
    lastIndexed: new Date('2026-06-12') 
  },
  { 
    id: '2', 
    name: 'ViHERMES - Xử phạt Hành chính Y tế (NĐ 117)', 
    description: 'Các điều khoản xử lý vi phạm quy định về quảng cáo dịch vụ khám chữa bệnh, vượt quá phạm vi chuyên môn chuyên khoa hoặc vi phạm giấy phép hoạt động.',
    docCount: 512, 
    lastIndexed: new Date('2026-05-20') 
  },
  { 
    id: '3', 
    name: 'ViHERMES - Đấu thầu & Cung ứng Dược phẩm', 
    description: 'Quy định đấu thầu thuốc quốc gia, báo giá biệt dược gốc, kế hoạch phân bổ biệt dược và quản lý chi phí cung ứng thuốc tại các cơ sở y tế.',
    docCount: 424, 
    lastIndexed: new Date('2026-07-01') 
  },
];

export default function DatasetsPage() {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => setSyncingId(null), 2000);
  };

  const AddSourceOption = ({ icon: Icon, label, desc, color }: any) => (
    <button className="sketch-box-irregular p-6 bg-surface hover:bg-marker/10 transition-all text-left flex gap-4 group">
      <div className={`w-14 h-14 border-2 border-border-pencil rounded-xl flex items-center justify-center ${color} rotate-[-4deg] group-hover:rotate-0 transition-transform shadow-sm`}>
        <Icon size={28} />
      </div>
      <div className="flex-1">
        <div className="font-display text-xl text-ink underline decoration-border-pencil/10">{label}</div>
        <p className="text-sm text-slate-500 italic mt-1 font-bold">{desc}</p>
      </div>
    </button>
  );

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full bg-canvas relative">
      <div className="flex items-center justify-between border-b-4 border-border-pencil pb-4">
        <div>
          <h1 className="text-4xl text-medical-blue">Cơ Sở Tri Thức Pháp Quy Y Tế</h1>
          <p className="text-slate-500 text-lg font-bold italic">Quản lý và đồng bộ hóa các văn bản quy phạm pháp luật y tế thuộc bộ dữ liệu kiểm thử ViHERMES.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="sketch-box flex items-center gap-2 bg-ink text-white px-6 py-3 text-lg font-display hover:translate-y-[-2px] hover:rotate-1 transition-all rotate-[-1deg]"
        >
          <Plus size={20} /> THÊM DỮ LIỆU
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {MOCK_DATASETS.map((dataset, idx) => (
          <motion.div
            key={dataset.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="sketch-box-irregular p-8 bg-white hover:bg-surface transition-all group rotate-[0.5deg]"
          >
            <div className="w-14 h-14 border-2 border-border-pencil bg-marker rounded-xl flex items-center justify-center text-ink mb-6 rotate-[-4deg] shadow-sm">
              <Database size={32} />
            </div>
            <h3 className="text-2xl underline decoration-marker decoration-8 underline-offset-[-2px]">{dataset.name}</h3>
            
            <p className="mt-4 text-sm text-slate-500 italic font-bold line-clamp-2 min-h-[40px]">
              {dataset.description}
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <div className="flex items-center gap-3 text-sm text-ink font-bold font-mono">
                <FileText size={16} className="text-border-pencil/50" />
                <span>{dataset.docCount}</span> PHÂN ĐOẠN (CHUNKS)
              </div>
              <div className="flex items-center gap-3 text-xs text-ink/60 font-black uppercase tracking-widest italic">
                <Clock size={16} className="text-border-pencil/50" />
                CẬP NHẬT: <span>{dataset.lastIndexed.toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t-2 border-dashed border-border-pencil/20 flex gap-4">
              <button 
                onClick={() => setSelectedDataset(dataset)}
                className="flex-1 py-3 border-2 border-border-pencil bg-canvas text-ink text-xs font-black uppercase tracking-widest hover:bg-marker/40 transition-colors rotate-[-1deg]"
              >
                MỞ RỘNG
              </button>
              <button 
                onClick={() => handleSync(dataset.id)}
                disabled={syncingId === dataset.id}
                className="flex-1 py-3 border-2 border-border-pencil bg-canvas text-ink text-xs font-black uppercase tracking-widest hover:bg-marker/40 transition-colors rotate-[1deg] flex items-center justify-center gap-2"
              >
                {syncingId === dataset.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    ĐANG ĐỒNG BỘ
                  </>
                ) : 'ĐỒNG BỘ LẠI'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="sketch-box-irregular max-w-xl w-full bg-white p-10 z-50 overflow-hidden relative rotate-1"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-ink hover:text-red-500 font-display text-2xl"
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-display mb-2 text-medical-blue">Nguồn Dữ Liệu Mới</h2>
              <p className="text-slate-500 font-bold italic mb-8 border-b-2 border-border-pencil pb-4">Chọn phương thức nhập dữ liệu chuyên khoa của bạn để lập chỉ mục RAG.</p>
              
              <div className="space-y-4">
                <AddSourceOption 
                  icon={Globe} 
                  label="Bộ dữ liệu Kaggle" 
                  desc="Đồng bộ trực tiếp từ các nghiên cứu lâm sàng công khai và lưu trữ của NIH." 
                  color="bg-blue-500/10 text-blue-600"
                />
                <AddSourceOption 
                  icon={Cloud} 
                  label="Google Drive" 
                  desc="Kết nối và tải dữ liệu thư mục hồ sơ bệnh án một cách an toàn từ đám mây." 
                  color="bg-green-500/10 text-green-600"
                />
                <AddSourceOption 
                  icon={Upload} 
                  label="Tải lên cục bộ" 
                  desc="Xử lý hồ sơ tóm tắt PDF, CSV hoặc DICOM từ chính thiết bị của bạn." 
                  color="bg-purple-500/10 text-purple-600"
                />
              </div>
              <div className="mt-8 pt-6 border-t-2 border-dashed border-border-pencil/20 text-center">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                   Khi tải dữ liệu lên, bạn cam kết tuân thủ các quy định của pháp luật Việt Nam về lưu trữ, quản lý và sử dụng các văn bản pháp quy y tế công khai.
                 </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDataset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDataset(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="sketch-box-irregular max-w-4xl w-full bg-white p-10 z-50 overflow-hidden relative rotate-[-1deg]"
            >
              <button 
                onClick={() => setSelectedDataset(null)}
                className="absolute top-4 right-4 text-ink hover:text-red-500 font-display text-2xl"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-6 mb-10 pb-6 border-b-2 border-border-pencil">
                <div className="w-20 h-20 border-2 border-border-pencil bg-marker rounded-xl flex items-center justify-center text-ink rotate-3 shadow-sm">
                  <Database size={40} />
                </div>
                <div>
                  <h2 className="text-4xl font-display text-medical-blue">{selectedDataset.name}</h2>
                  <p className="text-slate-500 font-bold italic text-lg">{selectedDataset.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <h4 className="font-display text-xl text-ink underline decoration-marker decoration-4">Cấu Trúc Tích Hợp</h4>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-canvas/30 sketch-box">
                         <div className="flex items-center gap-3">
                            <FileText size={20} className="text-medical-blue" />
                            <span className="font-black uppercase text-xs tracking-widest">Phân Đoạn Con (Chunks)</span>
                         </div>
                         <span className="text-2xl font-display">{selectedDataset.docCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-canvas/30 sketch-box">
                         <div className="flex items-center gap-3">
                            <Clock size={20} className="text-medical-blue" />
                            <span className="font-black uppercase text-xs tracking-widest">Phiên Bản Chỉ Mục</span>
                         </div>
                         <span className="text-lg font-bold">V-2.4.0</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-700 text-green-700 rounded-xl">
                         <CheckCircle2 size={24} />
                         <span className="font-bold">Trạng Thái Đồng Bộ: Hoàn Hảo</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-display text-xl text-ink underline decoration-marker decoration-4">Dữ Liệu Mẫu Gần Đây</h4>
                  <div className="p-6 bg-white border-2 border-dashed border-border-pencil/30 rounded-xl space-y-4 font-mono italic text-sm text-ink/70">
                    <p className="bg-canvas p-4 rounded border border-border-pencil/10">
                      "Giải pháp: Hoàn thiện bệnh án ngoại trú, bệnh án điện tử điều trị người nhiễm HIV và người phơi nhiễm HIV chuẩn HL7 FHIR..."
                    </p>
                    <p className="bg-canvas p-4 rounded border border-border-pencil/10">
                      "Cam kết: Đơn giá thầu cung cấp biệt dược gốc cho các cơ sở y tế năm 2024-2025 bắt buộc phải bao gồm thuế VAT có hiệu lực đến hết ngày 31/12/2025..."
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-center gap-6">
                 <button className="px-10 py-3 bg-ink text-white font-display text-xl rotate-1 hover:rotate-0 transition-transform">
                   TẢI DỮ LIỆU THÔ
                 </button>
                 <button 
                  onClick={() => setSelectedDataset(null)}
                  className="px-10 py-3 border-2 border-border-pencil font-display text-xl rotate-[-1deg] hover:rotate-0 transition-transform"
                 >
                   QUAY LẠI
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

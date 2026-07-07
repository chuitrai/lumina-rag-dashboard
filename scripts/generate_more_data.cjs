/**
 * Script to generate a larger, realistic medical and regulatory dataset
 * for the VIMEDRAG Med-RAG database.
 * 
 * Run this script using: node scripts/generate_more_data.cjs
 */

const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/data/rag_database.json');

// Real-world-like templates for Vietnamese Medical documents
const extraDocuments = [
  {
    id: "doc_hiv_4",
    source: "Chuong_Trinh_Chuyen_Doi_So_HIV_2025_2030.pdf",
    content: "Nâng cấp hệ thống thông tin quản lý người nhiễm HIV (HIV-INFO) phiên bản 4.0; triển khai thí điểm sổ sức khỏe điện tử tích hợp thông tin điều trị ARV trên ứng dụng VNeID.",
    date: "2025-08-15",
    metadata: {
      "Giai đoạn": "2025 - 2030",
      "Ứng dụng": "HIV-INFO 4.0",
      "Tích hợp": "Sổ sức khỏe điện tử VNeID"
    }
  },
  {
    id: "doc_hiv_5",
    source: "Chuong_Trinh_Chuyen_Doi_So_HIV_2025_2030.pdf",
    content: "Đào tạo, nâng cao năng lực cho đội ngũ cán bộ y tế tuyến cơ sở về kỹ năng khai thác và bảo mật dữ liệu điều trị HIV/AIDS trực tuyến.",
    date: "2025-11-05",
    metadata: {
      "Hạng mục": "Giải pháp Đào tạo",
      "Đối tượng": "Tuyến cơ sở",
      "Bảo mật": "Thông tin trực tuyến"
    }
  },
  {
    id: "doc_thuoc_4",
    source: "Ke_Hoach_Cung_Ung_Thuoc_Biet_Duoc_Goc_2024_2025.md",
    content: "Danh mục biệt dược gốc điều trị tim mạch và tăng huyết áp dự kiến áp dụng phương thức đàm phán thầu giá trực tiếp quốc tế nhằm cắt giảm chi phí trung gian tối thiểu 15%.",
    date: "2024-05-12",
    metadata: {
      "Lĩnh vực": "Tim mạch & Huyết áp",
      "Hình thức": "Đàm phán quốc tế",
      "Mục tiêu": "Tiết kiệm 15% chi phí"
    }
  },
  {
    id: "doc_thuoc_5",
    source: "Ke_Hoach_Cung_Ung_Thuoc_Biet_Duoc_Goc_2024_2025.md",
    content: "Báo cáo tiến độ phân bổ danh thầu các nhóm thuốc Insulin sinh học thế hệ mới tại các bệnh viện trung ương Đa khoa hạng 1 khu vực miền Bắc trong niên độ 2024.",
    date: "2024-09-30",
    metadata: {
      "Nhóm thuốc": "Insulin thế hệ mới",
      "Khu vực": "Miền Bắc",
      "Phân hạng": "Bệnh viện Đa khoa Hạng 1"
    }
  },
  {
    id: "doc_adv_3",
    source: "Xac_Nhan_Quang_Cao_7WEALTH_BOSWELLIA.csv",
    content: "Phê duyệt nội dung video truyền thông sản phẩm BOSWELLIA phát sóng trên các đài truyền hình địa phương. Thời lượng tối đa 30 giây, tuân thủ giấy phép xuất bản số 120/GP-XNQC.",
    date: "2025-04-18",
    metadata: {
      "Hình thức": "Video truyền thông",
      "Thời lượng": "30 giây",
      "Giấy phép": "Số 120/GP-XNQC"
    }
  },
  {
    id: "doc_adv_4",
    source: "Xac_Nhan_Quang_Cao_7WEALTH_BOSWELLIA.csv",
    content: "Xử phạt vi phạm hành chính đối với các trường hợp quảng cáo vượt quá tính năng bảo vệ khớp của sản phẩm BOSWELLIA trên các trang mạng xã hội không chính thức.",
    date: "2025-06-22",
    metadata: {
      "Biện pháp": "Xử phạt hành chính",
      "Nội dung vi phạm": "Quảng cáo quá sự thật",
      "Phạm vi": "Mạng xã hội"
    }
  },
  {
    id: "doc_cln_1",
    source: "Phac_Do_Dieu_Tri_Noi_Khoa_2026.pdf",
    content: "Phác đồ chuẩn hóa điều trị suy tim cấp độ III/IV: Kết hợp đồng thời thuốc ức chế SGLT2 và ARNI nhằm giảm thiểu tỷ lệ tái nhập viện trong vòng 30 ngày cho bệnh nhân cao tuổi.",
    date: "2026-02-15",
    metadata: {
      "Chuyên khoa": "Nội tim mạch",
      "Phác đồ": "Suy tim III/IV",
      "Sự kết hợp": "SGLT2 + ARNI"
    }
  },
  {
    id: "doc_cln_2",
    source: "Phac_Do_Dieu_Tri_Noi_Khoa_2026.pdf",
    content: "Khuyến cáo lâm sàng mới: Xét nghiệm định lượng chỉ số NT-proBNP định kỳ mỗi 3 tháng một lần để tiên lượng rủi ro biến cố mạch vành cấp ở bệnh nhân Đái tháo đường Typ 2.",
    date: "2026-05-10",
    metadata: {
      "Xét nghiệm": "NT-proBNP",
      "Chu kỳ": "3 tháng / lần",
      "Chỉ định": "Đái tháo đường Typ 2"
    }
  },
  {
    id: "doc_cln_3",
    source: "Nghien_Cuu_Giam_Sat_Ngoai_Tru.json",
    content: "Khảo sát cắt ngang trên 1200 hồ sơ bệnh án ngoại trú tại khu vực miền Tây: Tỷ lệ tuân thủ điều trị ARV đạt 92.5%, tuy nhiên tỷ lệ bỏ trị tăng nhẹ vào mùa mưa bão do khó khăn di chuyển.",
    date: "2025-10-18",
    metadata: {
      "Khu vực": "Miền Tây Nam Bộ",
      "Cỡ mẫu": "1200 hồ sơ",
      "Tỷ lệ tuân thủ": "92.5%"
    }
  }
];

// Rich QA matching corresponding documents
const extraQuestions = [
  {
    id: "q8",
    question: "Phiên bản nâng cấp nào của hệ thống HIV-INFO sẽ được triển khai tích hợp lên VNeID?",
    answer: "Hệ thống thông tin quản lý người nhiễm HIV sẽ được nâng cấp lên phiên bản HIV-INFO 4.0 và triển khai thí điểm tích hợp sổ sức khỏe điện tử cùng thông tin ARV trên ứng dụng VNeID.",
    retrievalIds: ["doc_hiv_4"],
    rerankIds: ["doc_hiv_4"],
    prompt: "[HỆ THỐNG] Bạn là VIMEDRAG, trợ lý phân tích RAG thông minh.\n\n[BỐI CẢNH LÂM SÀNG]\n- Hệ thống HIV-INFO phiên bản 4.0; tích hợp VNeID.\n\n[CÂU HỎI TRUY VẤN]\nPhiên bản nâng cấp nào của hệ thống HIV-INFO sẽ được triển khai tích hợp lên VNeID?\n\n[PHẢN HỒI]",
    metrics: {
      latency: 410,
      tokensUsed: 195,
      retrievalTime: 52,
      rerankTime: 26
    }
  },
  {
    id: "q9",
    question: "Mục tiêu cắt giảm chi phí tối thiểu của phương thức đàm phán thầu giá trực tiếp quốc tế với biệt dược tim mạch là bao nhiêu?",
    answer: "Mục tiêu của phương thức đàm phán thầu giá trực tiếp quốc tế đối với nhóm biệt dược tim mạch và huyết áp là cắt giảm tối thiểu 15% chi phí trung gian.",
    retrievalIds: ["doc_thuoc_4"],
    rerankIds: ["doc_thuoc_4"],
    prompt: "[HỆ THỐNG] Bạn là VIMEDRAG, trợ lý thầu thuốc chuyên nghiệp.\n\n[BỐI CẢNH]\n- Đàm phán trực tiếp giảm thiểu tối thiểu 15% chi phí.\n\n[CÂU HỎI TRUY VẤN]\nMục tiêu cắt giảm chi phí tối thiểu của phương thức đàm phán thầu giá trực tiếp quốc tế với biệt dược tim mạch là bao nhiêu?\n\n[PHẢN HỒI]",
    metrics: {
      latency: 385,
      tokensUsed: 172,
      retrievalTime: 45,
      rerankTime: 22
    }
  },
  {
    id: "q10",
    question: "Phác đồ điều trị suy tim cấp độ III/IV năm 2026 đề xuất kết hợp những loại thuốc nào?",
    answer: "Theo phác đồ chuẩn hóa điều trị suy tim cấp độ III/IV năm 2026, đề xuất kết hợp đồng thời thuốc ức chế SGLT2 và ARNI nhằm giảm tối đa tỷ lệ tái nhập viện trong vòng 30 ngày.",
    retrievalIds: ["doc_cln_1"],
    rerankIds: ["doc_cln_1"],
    prompt: "[HỆ THỐNG] Bạn là VIMEDRAG, trợ lý y khoa lâm sàng.\n\n[BỐI CẢNH LÂM SÀNG]\n- Kết hợp thuốc SGLT2 và ARNI cho bệnh nhân suy tim III/IV.\n\n[CÂU HỎI TRUY VẤN]\nPhác đồ điều trị suy tim cấp độ III/IV năm 2026 đề xuất kết hợp những loại thuốc nào?\n\n[PHẢN HỒI]",
    metrics: {
      latency: 440,
      tokensUsed: 215,
      retrievalTime: 60,
      rerankTime: 33
    }
  }
];

function run() {
  if (!fs.existsSync(targetPath)) {
    console.error(`Không tìm thấy file: ${targetPath}`);
    return;
  }

  const raw = fs.readFileSync(targetPath, 'utf8');
  const database = JSON.parse(raw);

  // Filter out duplicates to avoid duplicate IDs
  const currentDocIds = new Set(database.documents.map(d => d.id));
  const currentQIds = new Set(database.questions.map(q => q.id));

  extraDocuments.forEach(doc => {
    if (!currentDocIds.has(doc.id)) {
      database.documents.push(doc);
    }
  });

  extraQuestions.forEach(q => {
    if (!currentQIds.has(q.id)) {
      database.questions.push(q);
    }
  });

  fs.writeFileSync(targetPath, JSON.stringify(database, null, 2), 'utf8');
  console.log(`\n🎉 THÀNH CÔNG! Đã cập nhật thành công CSDL RAG.`);
  console.log(`📈 Tổng số phân đoạn hiện tại: ${database.documents.length}`);
  console.log(`❓ Tổng số câu hỏi RAG mẫu: ${database.questions.length}`);
}

run();

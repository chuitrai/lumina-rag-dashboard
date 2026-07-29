# ViHERMES Web RAG

Web Playground minh họa một pipeline RAG y tế tiếng Việt trên ViHERMES. Kết quả
trong trang Benchmark là thí nghiệm offline của nhóm; Playground là web demo
tương tác, sinh câu trả lời bằng **Ollama local** (không cần API key, không cần
GPU rời — chạy được ngay trên máy cá nhân).

## Pipeline web

```text
Question
  -> BM25 / Jina Dense / Hybrid RRF
  -> Top-20 candidates
  -> Optional Jina multilingual reranker
  -> Top-5 evidence
  -> Zero-Shot / Few-Shot / CoT prompt
  -> Ollama (local)
  -> Answer + citations + per-query metrics
```

Corpus được dựng trên toàn bộ dataset: các giá trị `evidence` của mỗi record được
nối thành một block, sau đó khử block trùng. Hai record cuối được cố định làm
Few-Shot demonstrations; 1.559 record còn lại thuộc evaluation.

Mặc định app dùng **BM25** (không cần embedding API) và **không rerank**, nên
chạy được hoàn toàn offline chỉ với Ollama — không cần bất kỳ API key trả phí
nào. Dense/Hybrid retrieval và Jina Reranker vẫn còn trong pipeline như một tùy
chọn nâng cao (xem mục "Tuỳ chọn nâng cao" bên dưới) nếu bạn muốn so sánh.

## Prompt presets

Các template nằm trong
[`src/config/promptPresets.ts`](src/config/promptPresets.ts). Đây là source dùng
chung cho UI và backend, nên có thể kiểm tra đầy đủ Zero-Shot, Few-Shot và CoT
ngay trong repository. Prompt Inspector hiển thị prompt đã render cùng Top-5
evidence của từng truy vấn.

## Cài đặt & Cấu hình

### Bước 1: Cài Ollama và tải model

```bash
ollama pull llama3.2:1b
```

Vì Ollama được gọi **từ server Express (Node), không phải từ trình duyệt**, bạn
**không cần bật CORS/`OLLAMA_ORIGINS`** như khi gọi thẳng từ web — chỉ cần
`ollama serve` (hoặc để app nền Ollama tự chạy) là đủ.

### Bước 2: Tạo file cấu hình

```powershell
Copy-Item .env.example .env
```

Mặc định `.env.example` đã trỏ sẵn tới Ollama local:

```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:1b"
```

Không đặt secrets trong biến `VITE_*`; các biến đó sẽ bị đưa vào browser bundle.

## Chạy local

```powershell
npm install
npm run dev
```

Mở `http://localhost:3000`.

### Đổi sang model Ollama khác để test
1. `ollama pull <tên-model>` (ví dụ `qwen3:8b`, `mistral:7b`).
2. Sửa `OLLAMA_MODEL` trong `.env` rồi khởi động lại `npm run dev`, **hoặc** chọn model
   trực tiếp ở dropdown **"Generator"** trên Sidebar (áp dụng ngay, không cần restart).
3. Không cần khởi động lại `ollama serve` — Ollama tự nạp đúng model theo tên gửi kèm
   trong mỗi request.

### Tuỳ chọn nâng cao: Dense/Hybrid retrieval + Jina Reranker
Mặc định không bắt buộc, nhưng nếu muốn thử nghiệm:

```env
JINA_API_KEY="..."
```

Sau đó chọn **Dense Vector**/**Hybrid RRF** ở mục "Retrieval" và/hoặc bật
**Jina Reranker v2** ở mục "Reranker" trên Sidebar. BM25 không cần key này;
Dense/Hybrid và Reranker mới cần `JINA_API_KEY`. Tạo dense cache một lần:

```powershell
npm run index:dense
```

## API

- `GET /api/health`: dataset, provider configuration (Ollama + Jina) và dense-index status.
- `GET /api/examples?limit=3`: câu hỏi mẫu.
- `POST /api/index/build`: tạo Jina dense cache (chỉ cần nếu dùng Dense/Hybrid).
- `POST /api/rag/query`: retrieval, optional reranking, prompt, generation (Ollama) và metrics.

## Deploy

App là một Express Web Service phục vụ cả React build và API:

```text
Build command: npm install && npm run build
Start command: npm run start
```

Đặt `OLLAMA_BASE_URL`/`OLLAMA_MODEL` (trỏ tới một instance Ollama máy chủ có thể
truy cập được) và, nếu dùng tính năng nâng cao, `JINA_API_KEY` bằng secret
environment variables của nền tảng deploy. `dataset.jsonl` được bundle trong
project; dense cache nên được tạo trước và commit/deploy cùng artifact nếu muốn
tránh gọi embedding cho toàn corpus khi instance mới khởi động.

Không nhập dữ liệu bệnh nhân thật vào web demo. Đây là hệ thống phục vụ học tập,
không phải công cụ tư vấn hoặc chẩn đoán y khoa.

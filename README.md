# ViHERMES Web RAG

Web Playground minh họa một pipeline RAG y tế tiếng Việt trên ViHERMES. Kết quả
trong trang Benchmark là thí nghiệm offline của nhóm; Playground là web demo độc
lập dùng hosted APIs để người xem tương tác mà không cần GPU, Ollama hoặc SSH.

## Pipeline web

```text
Question
  -> BM25 / Jina Dense / Hybrid RRF
  -> Top-20 candidates
  -> Optional Jina multilingual reranker
  -> Top-5 evidence
  -> Zero-Shot / Few-Shot / CoT prompt
  -> Gemini
  -> Answer + citations + per-query metrics
```

Corpus được dựng trên toàn bộ dataset: các giá trị `evidence` của mỗi record được
nối thành một block, sau đó khử block trùng. Hai record cuối được cố định làm
Few-Shot demonstrations; 1.559 record còn lại thuộc evaluation.

## Prompt presets

Các template nằm trong
[`src/config/promptPresets.ts`](src/config/promptPresets.ts). Đây là source dùng
chung cho UI và backend, nên có thể kiểm tra đầy đủ Zero-Shot, Few-Shot và CoT
ngay trong repository. Prompt Inspector hiển thị prompt đã render cùng Top-5
evidence của từng truy vấn.

## Cấu hình

```powershell
Copy-Item .env.example .env
```

Điền secrets ở backend:

```env
GEMINI_API_KEY="..."
JINA_API_KEY="..."
```

Không đặt secrets trong biến `VITE_*`; các biến đó sẽ bị đưa vào browser bundle.

## Chạy local

```powershell
npm install
npm run dev
```

Mở `http://localhost:3000`.

BM25 không cần Jina embedding, nhưng generation vẫn cần Gemini. Dense/Hybrid và
reranking cần `JINA_API_KEY`. Tạo dense cache một lần:

```powershell
npm run index:dense
```

## API

- `GET /api/health`: dataset, provider configuration và dense-index status.
- `GET /api/examples?limit=3`: câu hỏi mẫu.
- `POST /api/index/build`: tạo Jina dense cache.
- `POST /api/rag/query`: retrieval, optional reranking, prompt, generation và metrics.

## Deploy

App là một Express Web Service phục vụ cả React build và API:

```text
Build command: npm install && npm run build
Start command: npm run start
```

Đặt `GEMINI_API_KEY` và `JINA_API_KEY` bằng secret environment variables của nền
tảng deploy. `dataset.jsonl` được bundle trong project; dense cache nên được tạo
trước và commit/deploy cùng artifact nếu muốn tránh gọi embedding cho toàn corpus
khi instance mới khởi động.

Không nhập dữ liệu bệnh nhân thật vào web demo. Đây là hệ thống phục vụ học tập,
không phải công cụ tư vấn hoặc chẩn đoán y khoa.

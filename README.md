# Vietnamese Healthcare RAG

Web Playground minh họa một pipeline RAG y tế tiếng Việt trên ViHERMES. Kết quả
trong trang Benchmark là thí nghiệm offline của nhóm (chạy Ollama trên GPU
server riêng); Playground là web demo tương tác, sinh câu trả lời bằng
**Gemini free tier** — không cần GPU, host được công khai trên Vercel để người
khác tự trải nghiệm mà không cần cài gì cả.

## Pipeline web

```text
Question
  -> BM25 / Jina Dense / Hybrid RRF
  -> Top-20 candidates
  -> Optional Jina multilingual reranker
  -> Top-5 evidence
  -> Zero-Shot / Few-Shot / CoT prompt
  -> Gemini (free tier)
  -> Answer + citations + per-query metrics
```

Corpus được dựng trên toàn bộ dataset: các giá trị `evidence` của mỗi record được
nối thành một block, sau đó khử block trùng. Hai record cuối được cố định làm
Few-Shot demonstrations; 1.559 record còn lại thuộc evaluation.

Mặc định app dùng **BM25** (không cần embedding API) và **không rerank**, nên
chỉ cần `GEMINI_API_KEY` (miễn phí) là chạy được — không cần Ollama, không cần
GPU. Dense/Hybrid retrieval và Jina Reranker vẫn còn trong pipeline như một tùy
chọn nâng cao (xem mục "Tuỳ chọn nâng cao" bên dưới) nếu bạn muốn so sánh.

## Prompt presets

Các template nằm trong
[`src/config/promptPresets.ts`](src/config/promptPresets.ts). Đây là source dùng
chung cho UI và backend, nên có thể kiểm tra đầy đủ Zero-Shot, Few-Shot và CoT
ngay trong repository. Prompt Inspector hiển thị prompt đã render cùng Top-5
evidence của từng truy vấn.

## Cài đặt & Cấu hình

### Bước 1: Lấy Gemini API key (miễn phí)

Tạo key tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey) —
Google cho free tier với hạn mức request/phút, đủ dùng cho demo.

### Bước 2: Tạo file cấu hình

```powershell
Copy-Item .env.example .env
```

Điền key vào `.env`:

```env
GEMINI_API_KEY="dán-key-của-bạn-vào-đây"
GEMINI_MODEL="gemini-2.5-flash"
```

Không đặt secrets trong biến `VITE_*`; các biến đó sẽ bị đưa vào browser bundle.
`.env` đã được `.gitignore`, không commit lên git.

## Chạy local

```powershell
npm install
npm run dev
```

Mở `http://localhost:3000`.

### Đổi sang model Gemini khác để test
Chọn trực tiếp ở dropdown **"Generator"** trên Sidebar (áp dụng ngay, không cần
restart): `gemini-2.5-flash` (mặc định) hoặc `gemini-2.5-flash-lite`.

### Tuỳ chọn nâng cao: Dense/Hybrid retrieval + Jina Reranker
Mặc định không bắt buộc, nhưng nếu muốn thử nghiệm:

```env
JINA_API_KEY="..."
```

Sau đó chọn **Dense Vector**/**Hybrid RRF** ở mục "Strategy" và/hoặc bật
**Jina Reranker v2** ở mục "Reranker" trên Sidebar. BM25 không cần key này;
Dense/Hybrid và Reranker mới cần `JINA_API_KEY`. Tạo dense cache một lần:

```powershell
npm run index:dense
```

## API

- `GET /api/health`: dataset, provider configuration (Gemini + Jina) và dense-index status.
- `GET /api/examples?limit=3`: câu hỏi mẫu.
- `POST /api/index/build`: tạo Jina dense cache (chỉ cần nếu dùng Dense/Hybrid).
- `POST /api/rag/query`: retrieval, optional reranking, prompt, generation (Gemini) và metrics.

## Deploy lên Vercel

Kiến trúc: **frontend** (React/Vite build ra `dist/`) được Vercel host tĩnh;
**backend** (`server/app.ts`) chạy dưới dạng 1 Vercel Serverless Function tại
`api/index.ts`, mọi request `/api/*` được `vercel.json` rewrite vào function
này (`fs`-based routing, không cần cấu hình build phức tạp).

### Cách 1 — Qua giao diện web Vercel (khuyên dùng, không cần cài CLI)

1. Đăng nhập [vercel.com](https://vercel.com) bằng GitHub, bấm **Add New → Project**.
2. Import repo này, chọn nhánh **`prod`**.
3. Vercel tự nhận diện `vercel.json` (Build Command / Output Directory đã khai
   báo sẵn trong file, không cần sửa gì ở bước "Configure Project").
4. Ở mục **Environment Variables**, thêm:
   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | key bạn lấy ở Bước 1 phần Cài đặt |
   | `GEMINI_MODEL` | `gemini-2.5-flash` (tuỳ chọn, có default) |
   | `JINA_API_KEY` | *(bỏ trống nếu không dùng Dense/Hybrid/Reranker)* |

   Đây là nơi **dán secret token** — không paste vào code, không commit vào
   git. Vercel mã hoá và chỉ inject vào runtime của serverless function.
5. Bấm **Deploy**. Xong sẽ có URL dạng `https://<project>.vercel.app`.

### Cách 2 — Qua Vercel CLI (nếu thích thao tác terminal)

```powershell
npm install -g vercel
vercel login
vercel link          # chọn/tạo project, chọn nhánh prod khi được hỏi
vercel env add GEMINI_API_KEY production   # dán key khi được nhắc, KHÔNG gõ trong command
vercel env add GEMINI_MODEL production     # gõ: gemini-2.5-flash
vercel --prod        # deploy bản chính thức
```

`vercel env add <NAME> production` sẽ hỏi giá trị ở một dòng nhập riêng (không
hiện lại trên terminal history/log) — đây là cách an toàn để đưa secret vào,
tránh việc key nằm trong lịch sử lệnh.

### Sau khi deploy: đổi/xoay key

Vào **Project Settings → Environment Variables** trên Vercel, sửa giá trị
`GEMINI_API_KEY`, rồi vào tab **Deployments** bấm **Redeploy** ở bản mới nhất
(biến môi trường chỉ áp dụng cho lần build/deploy tiếp theo, không tự động áp
dụng cho các serverless function instance đang chạy).

### Lưu ý riêng cho môi trường serverless

- Vercel Functions có filesystem **chỉ đọc** (trừ `/tmp`) — `vercel.json` đã
  cấu hình `includeFiles: "dataset.jsonl"` để bundle sẵn dataset cùng function,
  và `server/app.ts` tự chuyển cache của Dense embedding sang `/tmp` khi chạy
  trên Vercel (biến `process.env.VERCEL` được nền tảng tự set).
- Mỗi cold start sẽ load lại `dataset.jsonl` (~1.550 evidence chunks) vào bộ
  nhớ — độ trễ request đầu tiên sau khi function "ngủ" có thể cao hơn bình
  thường vài trăm ms tới 1-2s, đây là đặc điểm bình thường của serverless chứ
  không phải lỗi.

Không nhập dữ liệu bệnh nhân thật vào web demo. Đây là hệ thống phục vụ học tập,
không phải công cụ tư vấn hoặc chẩn đoán y khoa.

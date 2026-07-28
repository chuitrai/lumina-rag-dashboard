# ViHERMES RAG - Hệ thống tra cứu văn bản pháp quy y tế (Ollama Local LLM)

Dự án này là một ứng dụng React + Vite + Tailwind CSS tích hợp hệ thống Med-RAG / ViHERMES RAG chuyên dụng, xử lý truy vấn văn bản pháp quy và điều luật y tế của Việt Nam sử dụng mô hình ngôn ngữ lớn (LLM) chạy local qua **Ollama**.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Khởi động Ollama trên máy local của bạn
Do ứng dụng web chạy trực tiếp trên trình duyệt nên bạn **bắt buộc phải bật CORS** để trình duyệt có thể gọi trực tiếp tới Ollama API.

*   **Trên macOS / Linux:**
    Mở Terminal và chạy lệnh sau:
    ```bash
    OLLAMA_ORIGINS="*" ollama serve
    ```

*   **Trên Windows (Command Prompt / CMD):**
    ```cmd
    set OLLAMA_ORIGINS=*
    ollama serve
    ```

*   **Trên Windows (PowerShell):**
    ```powershell
    $env:OLLAMA_ORIGINS="*"
    ollama serve
    ```

> ⚠️ **Lỗi thường gặp: `bind: Only one usage of each socket address...` (cổng 11434 đã được dùng)**
> Sau khi cài đặt, Ollama trên Windows/macOS thường tự chạy sẵn dưới dạng ứng dụng nền (icon trong khay hệ thống) và đã chiếm cổng `11434` — **chưa bật CORS**. Khi đó lệnh `ollama serve` thủ công ở trên sẽ báo lỗi trùng cổng. Cách xử lý:
> 1. Đặt biến môi trường `OLLAMA_ORIGINS` **vĩnh viễn** (chỉ cần làm 1 lần):
>    ```powershell
>    setx OLLAMA_ORIGINS "*"
>    ```
> 2. Thoát ứng dụng Ollama đang chạy (chuột phải icon Ollama ở khay hệ thống → **Quit Ollama**, hoặc `taskkill /IM ollama.exe /F` và `taskkill /IM "ollama app.exe" /F` trong PowerShell).
> 3. Mở lại ứng dụng Ollama (Start Menu → Ollama) để nó tự khởi động `ollama serve` với CORS đã bật — từ nay không cần chạy `ollama serve` thủ công nữa mỗi lần mở máy.
>
> Kiểm tra nhanh CORS đã bật đúng chưa:
> ```powershell
> curl.exe -I -X OPTIONS http://localhost:11434/api/generate -H "Origin: http://localhost:3000"
> ```
> Nếu thấy header `Access-Control-Allow-Origin: http://localhost:3000` (hoặc `*`) là đã ổn.

### Bước 2: Tải Mô hình (Model) mặc định
Tải mô hình ngôn ngữ mặc định (`llama3.2:1b` — bản nhẹ, phù hợp để test nhanh) về máy:
```bash
ollama pull llama3.2:1b
```

### Bước 3: Chạy dự án web
Cài đặt các gói phụ thuộc và khởi động máy chủ thử nghiệm (Development Server):
```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy dự án ở chế độ local dev
npm run dev
```
Truy cập ứng dụng tại địa chỉ mặc định hiển thị trên Terminal (ví dụ: `http://localhost:3000`).

---

## ⚙️ Cách Thay Đổi Địa Chỉ (URL) và Mô Hình (Model) Ollama

Có **3 cách** linh hoạt để bạn thay đổi cấu hình Ollama:

### Cách 1: Thay đổi trực tiếp trên Giao diện ứng dụng (Khuyên dùng)
1. Mở ứng dụng trên trình duyệt.
2. Điều hướng tới mục **Cài đặt** (Settings) ở thanh Sidebar bên trái.
3. Tại phần **Cấu Hình LLM Ollama Local**:
    *   **Địa chỉ Ollama API (Base URL):** Thay đổi `http://localhost:11434` thành địa chỉ IP hoặc cổng khác nếu bạn chạy Ollama trên máy khác hoặc qua mạng LAN.
    *   **Mô hình Ollama Mặc định:** Thay đổi tên model (ví dụ: `llama3:8b`, `mistral:7b`, `gemma2:9b`).
4. Hệ thống sẽ tự động ghi nhớ cấu hình của bạn cho các phiên làm việc tiếp theo.

### Cách 2: Sử dụng Tệp cấu hình môi trường `.env`
Bạn có thể tạo tệp `.env` ở thư mục gốc của dự án (sao chép từ `.env.example`) và ghi đè cấu hình:
```env
# Địa chỉ cổng của Ollama local
OLLAMA_BASE_URL="http://localhost:11434"

# Mô hình LLM bạn muốn sử dụng
OLLAMA_MODEL="llama3.2:1b"
```

### Cách 3: Sử dụng thanh chọn mô hình trong Ô Chat
Ngay tại thanh tiêu đề chat, nhấn vào nút chọn Model ("Suy Luận") để chọn nhanh các mô hình đích như `llama3.2:1b` (mặc định), `qwen3:8b`, `llama3:8b`, `mistral:7b` hoặc chuyển đổi ngược lại mô hình Gemini kế thừa nếu cần thiết.

### ✅ Checklist: Đổi sang một Model khác cần làm gì?
Khi muốn dùng một model Ollama khác (ví dụ chuyển từ `llama3.2:1b` sang `qwen3:8b`), làm theo đủ các bước sau — thiếu bước nào cũng sẽ khiến app báo lỗi hoặc dùng nhầm model cũ:

1. **Tải model về máy** (bắt buộc, chỉ cần làm 1 lần cho mỗi model):
   ```bash
   ollama pull qwen3:8b
   ```
   Kiểm tra model đã có trong máy: `ollama list`.
2. **Trỏ app sang model mới** — chọn 1 trong 3 cách ở trên (khuyên dùng **Cách 1** hoặc **Cách 3** vì áp dụng ngay, không cần khởi động lại):
   *   Cách 1/3 (UI): đổi ngay lập tức, không cần thao tác gì thêm.
   *   Cách 2 (`.env`): phải dừng và chạy lại `npm run dev` thì biến môi trường mới có hiệu lực.
3. **Không cần khởi động lại `ollama serve`** — Ollama tự nạp model theo tên được gửi trong mỗi request, chỉ cần model đã pull xong ở bước 1.
4. Gửi thử một câu hỏi trong khung chat để xác nhận app phản hồi đúng bằng model mới.

---

## 🔒 Lợi ích của kiến trúc Offline RAG
*   **Bảo mật 100%:** Dữ liệu hồ sơ y khoa, văn bản pháp quy nhạy cảm không bao giờ bị truyền tải ra ngoài internet.
*   **Không tốn chi phí:** Chạy hoàn toàn miễn phí trên phần cứng cá nhân không phụ thuộc API Key hay giới hạn Quota.
*   **Tốc độ ổn định:** Phản hồi nhanh chóng với độ trễ thấp tối đa.

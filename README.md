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

### Bước 2: Tải Mô hình (Model) mặc định
Tải mô hình ngôn ngữ (ví dụ: `qwen3:8b`, `llama3` hoặc `mistral`) về máy:
```bash
ollama pull qwen3:8b
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
OLLAMA_MODEL="qwen3:8b"
```

### Cách 3: Sử dụng thanh chọn mô hình trong Ô Chat
Ngay tại ô nhập câu hỏi tra cứu, bạn có thể nhấn vào biểu tượng bánh răng cấu hình hoặc nút chọn Model ở thanh tiêu đề chat để chọn nhanh các mô hình đích như `qwen3:8b`, `llama3:8b`, `mistral:7b` hoặc chuyển đổi ngược lại mô hình Gemini kế thừa nếu cần thiết.

---

## 🔒 Lợi ích của kiến trúc Offline RAG
*   **Bảo mật 100%:** Dữ liệu hồ sơ y khoa, văn bản pháp quy nhạy cảm không bao giờ bị truyền tải ra ngoài internet.
*   **Không tốn chi phí:** Chạy hoàn toàn miễn phí trên phần cứng cá nhân không phụ thuộc API Key hay giới hạn Quota.
*   **Tốc độ ổn định:** Phản hồi nhanh chóng với độ trễ thấp tối đa.

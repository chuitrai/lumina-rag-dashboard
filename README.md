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

### 🔄 Đổi sang một Model khác để Test (thay vì `llama3.2:1b`)
Mặc định dự án dùng `llama3.2:1b` (bản nhẹ ~1.3GB, tải nhanh, phù hợp để test luồng chạy). Muốn thử một model khác (ví dụ `qwen3:8b`, `llama3:8b`, `mistral:7b`, `gemma2:9b`...), làm theo đúng thứ tự dưới đây — thiếu bước nào app sẽ báo lỗi hoặc vẫn dùng nhầm model cũ:

**Bước 1 — Tải model về máy (bắt buộc, chỉ cần làm 1 lần cho mỗi model):**
```bash
ollama pull qwen3:8b
```
Model càng lớn (8B, 9B...) thì tải càng lâu và cần máy có RAM/VRAM đủ để chạy mượt. Kiểm tra model đã có trong máy chưa:
```bash
ollama list
```

**Bước 2 — Test model đó độc lập với Ollama trước, chưa cần đụng tới web app** (giúp xác định lỗi là do model/Ollama hay do web app nếu sau này gặp trục trặc):
```bash
ollama run qwen3:8b "Xin chào, bạn là ai?"
```
Nếu model trả lời được ở bước này thì chắc chắn Ollama đã sẵn sàng phục vụ web app.

**Bước 3 — Trỏ web app sang model mới**, chọn 1 trong 3 cách ở mục trên:
*   **Cách 1 (Settings trên UI)** hoặc **Cách 3 (dropdown chọn Model ở ô chat)**: đổi có hiệu lực **ngay lập tức**, không cần khởi động lại gì cả — khuyên dùng khi đang test qua lại nhiều model.
*   **Cách 2 (sửa `.env`)**: phải dừng (`Ctrl+C`) và chạy lại `npm run dev` thì biến `OLLAMA_MODEL` mới có hiệu lực.

> Lưu ý: **không cần khởi động lại `ollama serve`** khi đổi model — Ollama tự nạp đúng model theo tên gửi kèm trong mỗi request, miễn là model đó đã `pull` xong ở Bước 1.

**Bước 4 — Xác nhận qua UI:** gửi thử một câu hỏi trong khung chat. Ở panel bên phải, tab **"Suy Luận"** trên thanh tiêu đề chat và mục **"Prompt"** sẽ hiển thị đúng tên model mới đang dùng để tạo câu trả lời.

---

## 🔒 Lợi ích của kiến trúc Offline RAG
*   **Bảo mật 100%:** Dữ liệu hồ sơ y khoa, văn bản pháp quy nhạy cảm không bao giờ bị truyền tải ra ngoài internet.
*   **Không tốn chi phí:** Chạy hoàn toàn miễn phí trên phần cứng cá nhân không phụ thuộc API Key hay giới hạn Quota.
*   **Tốc độ ổn định:** Phản hồi nhanh chóng với độ trễ thấp tối đa.

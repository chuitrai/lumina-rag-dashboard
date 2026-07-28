export type PromptPreset = 'zero-shot' | 'few-shot' | 'cot' | 'custom';

export const PROMPT_PRESETS: Record<Exclude<PromptPreset, 'custom'>, {
  label: string;
  description: string;
  template: string;
}> = {
  'zero-shot': {
    label: 'Zero-Shot',
    description: 'Instruction + Top-5 evidence, không có ví dụ mẫu.',
    template: `Dựa vào các thông tin y khoa sau đây:
{{context}}

Hãy trả lời câu hỏi: {{question}}`,
  },
  'few-shot': {
    label: 'Few-Shot · ViHERMES',
    description: 'Hai mẫu ground truth cố định, sau đó là Top-5 evidence của câu hỏi mới.',
    template: `Dưới đây là hai ví dụ hỏi đáp thật từ ViHERMES:
{{examples}}

Dựa vào các thông tin y khoa sau đây:
{{context}}

Hãy trả lời câu hỏi: {{question}}`,
  },
  cot: {
    label: 'Chain-of-Thought',
    description: 'Yêu cầu suy luận có cấu trúc; UI chỉ hiển thị nội dung trong thẻ answer.',
    template: `Dựa vào các thông tin y khoa sau đây:
{{context}}

Hãy thực hiện các bước sau để trả lời câu hỏi: {{question}}
1. Phân tích các dữ kiện y khoa chính từ ngữ cảnh đã cho.
2. Suy luận logic về mối liên hệ giữa các dữ kiện này với câu hỏi.
3. Đưa ra câu trả lời cuối cùng dựa trên các suy luận trên.

Vui lòng trình bày suy luận trong thẻ <thought>...</thought> và câu trả lời rút gọn nhất trong thẻ <answer>...</answer>.`,
  },
};

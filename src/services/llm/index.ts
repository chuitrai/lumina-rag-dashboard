/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  stream?: boolean;
  format?: 'json'; // structured output
}

export interface ILLMProvider {
  name: string;
  generate(prompt: string, options?: LLMRequestOptions): Promise<string>;
  streamGenerate(prompt: string, onChunk: (text: string) => void, options?: LLMRequestOptions): Promise<string>;
  chat(messages: Array<{ role: string; content: string }>, options?: LLMRequestOptions): Promise<string>;
  streamChat(messages: Array<{ role: string; content: string }>, onChunk: (text: string) => void, options?: LLMRequestOptions): Promise<string>;
}

/**
 * Ollama Provider
 * Interacts directly with the local Ollama REST API.
 * Default Base URL: http://localhost:11434
 */
export class OllamaProvider implements ILLMProvider {
  public name = 'Ollama';
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = baseUrl || (process.env.OLLAMA_BASE_URL as string) || 'http://localhost:11434';
    // Clean trailing slash
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel || (process.env.OLLAMA_MODEL as string) || 'qwen3:8b';
  }

  private getModel(options?: LLMRequestOptions): string {
    return options?.model || this.defaultModel;
  }

  async generate(prompt: string, options?: LLMRequestOptions): Promise<string> {
    const model = this.getModel(options);
    const system = options?.systemPrompt;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
        format: options?.format,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama generate error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  async streamGenerate(prompt: string, onChunk: (text: string) => void, options?: LLMRequestOptions): Promise<string> {
    const model = this.getModel(options);
    const system = options?.systemPrompt;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
        format: options?.format,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama streamGenerate error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream is not supported by this browser.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const chunkText = parsed.response || '';
            if (chunkText) {
              fullText += chunkText;
              onChunk(chunkText);
            }
          } catch (e) {
            console.error('Failed to parse Ollama generate stream line:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullText;
  }

  async chat(messages: Array<{ role: string; content: string }>, options?: LLMRequestOptions): Promise<string> {
    const model = this.getModel(options);
    const system = options?.systemPrompt;

    const bodyMessages = [...messages];
    if (system) {
      bodyMessages.unshift({ role: 'system', content: system });
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: bodyMessages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
        format: options?.format,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  async streamChat(
    messages: Array<{ role: string; content: string }>,
    onChunk: (text: string) => void,
    options?: LLMRequestOptions
  ): Promise<string> {
    const model = this.getModel(options);
    const system = options?.systemPrompt;

    const bodyMessages = [...messages];
    if (system) {
      bodyMessages.unshift({ role: 'system', content: system });
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: bodyMessages,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
        },
        format: options?.format,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama streamChat error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream is not supported by this browser.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const chunkText = parsed.message?.content || '';
            if (chunkText) {
              fullText += chunkText;
              onChunk(chunkText);
            }
          } catch (e) {
            console.error('Failed to parse Ollama chat stream line:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullText;
  }
}

/**
 * Gemini Provider (kept but disabled/fallback)
 */
export class GeminiProvider implements ILLMProvider {
  public name = 'Gemini';
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel?: string) {
    this.apiKey = apiKey || (process.env.GEMINI_API_KEY as string) || '';
    this.defaultModel = defaultModel || 'gemini-1.5-flash';
  }

  async generate(prompt: string, options?: LLMRequestOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini generate error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async streamGenerate(prompt: string, onChunk: (text: string) => void, options?: LLMRequestOptions): Promise<string> {
    // Basic fallback implementation of streaming using REST API chunking or direct return
    const text = await this.generate(prompt, options);
    onChunk(text);
    return text;
  }

  async chat(messages: Array<{ role: string; content: string }>, options?: LLMRequestOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini chat error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async streamChat(
    messages: Array<{ role: string; content: string }>,
    onChunk: (text: string) => void,
    options?: LLMRequestOptions
  ): Promise<string> {
    const text = await this.chat(messages, options);
    onChunk(text);
    return text;
  }
}

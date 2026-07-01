import { LlmProvider, ChatOptions, ChatResponse } from './llm-provider.interface';

export class OllamaProvider implements LlmProvider {
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3';
  }

  async generateChat(messages: { role: string; content: string }[], options?: ChatOptions): Promise<ChatResponse> {
    const prompt = messages
      .map((m) => {
        if (m.role === 'system') return `<|system|>\n${m.content}</s>`;
        if (m.role === 'user') return `<|user|>\n${m.content}</s>`;
        if (m.role === 'assistant') return `<|assistant|>\n${m.content}</s>`;
        return m.content;
      })
      .join('\n');

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        prompt,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 4096,
        },
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    return { content: data.response || '', model: data.model || this.defaultModel };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.defaultModel, prompt: text }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama Embedding API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    return data.embedding || [];
  }
}

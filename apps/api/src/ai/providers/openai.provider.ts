import { LlmProvider, ChatOptions, ChatResponse } from './llm-provider.interface';

interface OpenAiMessage {
  role: string;
  content: string;
}

interface OpenAiResponse {
  choices: { message: { content: string }; finish_reason: string }[];
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface OpenAiEmbeddingResponse {
  data: { embedding: number[] }[];
}

export class OpenAIProvider implements LlmProvider {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateChat(messages: { role: string; content: string }[], options?: ChatOptions): Promise<ChatResponse> {
    const body: any = {
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${res.status} ${err}`);
    }

    const data: OpenAiResponse = await res.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, input: text }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI Embedding API error: ${res.status} ${err}`);
    }

    const data: OpenAiEmbeddingResponse = await res.json();
    return data.data[0]?.embedding || [];
  }
}

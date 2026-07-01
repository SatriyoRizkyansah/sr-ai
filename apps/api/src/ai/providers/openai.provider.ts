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
    this.baseUrl = process.env.OPENAI_BASE_URL || '';
    // this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.apiKey = process.env.OPENAI_API_KEY || '';
    // this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.defaultModel = process.env.OPENAI_MODEL || '';
  }

  private parseJsonResponse<T>(raw: string): T {
    try {
      return JSON.parse(raw) as T;
    } catch {
      const startIndex = raw.search(/[\[{]/);
      if (startIndex >= 0) {
        const jsonSlice = this.extractFirstJsonValue(raw.slice(startIndex));
        if (jsonSlice) {
          try {
            return JSON.parse(jsonSlice) as T;
          } catch {
            // fall through to the error below
          }
        }
      }

      throw new Error(`OpenAI API returned invalid JSON: ${raw.slice(0, 500)}`);
    }
  }

  private extractFirstJsonValue(input: string): string | null {
    const opening = input[0];
    if (opening !== '{' && opening !== '[') {
      return null;
    }

    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{' || char === '[') {
        stack.push(char);
        continue;
      }

      if (char === '}' || char === ']') {
        const last = stack.pop();
        if (!last) {
          return null;
        }

        const matches = (last === '{' && char === '}') || (last === '[' && char === ']');
        if (!matches) {
          return null;
        }

        if (stack.length === 0) {
          return input.slice(0, index + 1);
        }
      }
    }

    return null;
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

    const raw = await res.text();
    const data = this.parseJsonResponse<OpenAiResponse>(raw);
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

    const raw = await res.text();
    const data = this.parseJsonResponse<OpenAiEmbeddingResponse>(raw);
    return data.data[0]?.embedding || [];
  }
}

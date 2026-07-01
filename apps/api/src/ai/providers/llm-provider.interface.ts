export interface LlmProvider {
  generateChat(messages: { role: string; content: string }[], options?: ChatOptions): Promise<ChatResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

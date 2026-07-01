import { Injectable } from '@nestjs/common';
import { LlmProviderFactory } from './providers/provider-factory';
import { LlmProvider } from './providers/llm-provider.interface';

@Injectable()
export class AiService {
  private provider: LlmProvider;

  constructor() {
    this.provider = LlmProviderFactory.create();
  }

  async chat(
    messages: { role: string; content: string }[],
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ) {
    return this.provider.generateChat(messages, options);
  }

  async embedding(text: string): Promise<number[]> {
    return this.provider.generateEmbedding(text);
  }

  async ragChat(
    query: string,
    contextChunks: { content: string; documentTitle?: string; score?: number }[],
    chatHistory?: { role: string; content: string }[],
  ) {
    const context = contextChunks
      .map((c, i) => `[Source ${i + 1}${c.documentTitle ? `: ${c.documentTitle}` : ''}]\n${c.content}`)
      .join('\n\n');

    const systemPrompt = `You are DocMind AI, an intelligent document assistant. Answer questions based on the provided context. If you cannot find the answer in the context, say so politely. Always cite your sources using [Source N] notation.

Context:\n${context}`;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []),
      { role: 'user', content: query },
    ];

    return this.provider.generateChat(messages);
  }
}

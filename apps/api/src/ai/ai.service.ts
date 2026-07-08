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
    contextChunks: {
      content: string;
      documentTitle?: string;
      score?: number;
    }[],
    chatHistory?: { role: string; content: string }[],
  ) {
    if (!contextChunks || contextChunks.length === 0) {
      const noContextPrompt = `You are DocMind AI, an intelligent document assistant. The user has asked a question but there are no document chunks available to provide context. 

Politely let the user know that they need to:
1. Upload documents first
2. Wait for them to finish processing (status: READY)
3. Then ask questions about those documents

Do NOT try to answer the question from your own knowledge. Just guide the user to upload documents.`;

      const messages: { role: string; content: string }[] = [
        { role: 'system', content: noContextPrompt },
        ...(chatHistory || []),
        { role: 'user', content: query },
      ];

      return this.provider.generateChat(messages);
    }

    const context = contextChunks
      .map(
        (c, i) =>
          `[Source ${i + 1}${c.documentTitle ? `: ${c.documentTitle}` : ''}]\n${c.content}`,
      )
      .join('\n\n');

    const systemPrompt = `You are DocMind AI, an intelligent document assistant. Answer questions STRICTLY based on the provided context below.

Rules:
- If the context does NOT contain information to answer the question, say "I don't have enough information about that in the uploaded documents." — do NOT make up answers.
- Do NOT include [Source N: ...] citations in your response. Just answer naturally.
- Format your response using clean markdown:
  - Use **bold** for key terms or category names
  - Use bullet points (- ) for lists of items or facts
  - Keep each bullet point short and clear (one line each)
- Be concise and accurate.
- Use the same language as the user's question.

Context:\n${context}`;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []),
      { role: 'user', content: query },
    ];

    return this.provider.generateChat(messages);
  }
}

import { LlmProvider } from './llm-provider.interface';
import { OpenAIProvider } from './openai.provider';
import { OllamaProvider } from './ollama.provider';

export type ProviderType = 'openai' | 'ollama';

export class LlmProviderFactory {
  static create(type?: ProviderType): LlmProvider {
    const provider = type || (process.env.LLM_PROVIDER as ProviderType) || 'openai';
    switch (provider) {
      case 'ollama':
        return new OllamaProvider();
      case 'openai':
      default:
        return new OpenAIProvider();
    }
  }
}

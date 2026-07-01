import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LocalEmbeddingService {
  private pipeline: any = null;
  private loading = false;
  private loadPromise: Promise<any> | null = null;

  async getEmbedding(text: string): Promise<number[]> {
    const pipe = await this.getPipeline();
    const result = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  }

  private async getPipeline(): Promise<any> {
    if (this.pipeline) return this.pipeline;
    if (this.loadPromise) return this.loadPromise;

    this.loading = true;
    this.loadPromise = this.loadModel();
    return this.loadPromise;
  }

  private async loadModel(): Promise<any> {
    try {
      // Use new Function to bypass TS CommonJS transpilation of dynamic import
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      const transformers = await dynamicImport('@xenova/transformers');

      // Use a small, fast sentence transformer model
      const modelName = 'Xenova/all-MiniLM-L6-v2';
      console.log(`[LocalEmbedding] Loading model: ${modelName}...`);
      const pipe = await transformers.pipeline('feature-extraction', modelName, {
        quantized: true,
      });
      console.log(`[LocalEmbedding] Model loaded successfully!`);
      this.pipeline = pipe;
      return pipe;
    } catch (err: any) {
      console.error(`[LocalEmbedding] Failed to load model: ${err.message}`);
      throw err;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }
}

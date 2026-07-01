import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { LocalEmbeddingService } from './local-embedding.service';

@Module({
  providers: [AiService, LocalEmbeddingService],
  exports: [AiService, LocalEmbeddingService],
})
export class AiModule {}

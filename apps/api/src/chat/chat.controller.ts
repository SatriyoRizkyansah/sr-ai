import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { LocalEmbeddingService } from '../ai/local-embedding.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import {
  CreateChatSessionDto,
  SendMessageDto,
  UpdateSessionDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private aiService: AiService,
    private localEmbedding: LocalEmbeddingService,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  @Post('sessions')
  async createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChatSessionDto,
  ) {
    this.logger.info('CHAT_CREATE_SESSION', `Creating new chat session`, {
      userId,
      title: dto.title,
    });
    const session = await this.chatService.createSession(userId, dto.title);
    this.logger.info('CHAT_CREATE_SESSION', `Session created: ${session.id}`, {
      sessionId: session.id,
    });
    return session;
  }

  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    this.logger.debug('CHAT_LIST_SESSIONS', `Fetching sessions for user`, {
      userId,
    });
    return this.chatService.getSessions(userId);
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string, @CurrentUser('id') userId: string) {
    this.logger.debug('CHAT_GET_SESSION', `Fetching session ${id}`, {
      sessionId: id,
    });
    return this.chatService.getSession(id, userId);
  }

  @Delete('sessions/:id')
  async deleteSession(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    this.logger.info('CHAT_DELETE_SESSION', `Deleting session ${id}`, {
      sessionId: id,
    });
    return this.chatService.deleteSession(id, userId);
  }

  @Patch('sessions/:id')
  async updateSession(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    this.logger.info('CHAT_UPDATE_SESSION', `Updating session ${id}`, {
      sessionId: id,
      ...dto,
    });
    return this.chatService.updateSession(id, userId, dto);
  }

  @Get('sessions/:id/messages')
  getMessages(@Param('id') id: string, @CurrentUser('id') userId: string) {
    this.logger.debug(
      'CHAT_GET_MESSAGES',
      `Fetching messages for session ${id}`,
      { sessionId: id },
    );
    return this.chatService.getMessages(id, userId);
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    this.logger.info(
      'CHAT_SEND_MESSAGE',
      `Processing user message in session ${id}`,
      {
        sessionId: id,
        contentLength: dto.content.length,
      },
    );

    // Save user message
    await this.chatService.saveMessage(id, 'USER', dto.content);
    this.logger.debug('CHAT_SEND_MESSAGE', `User message saved`, {
      sessionId: id,
    });

    // Auto-title: if session title is "New Chat", rename from first message
    const currentSession = await this.chatService.getSession(id, userId);
    if (
      currentSession.title === 'New Chat' &&
      currentSession.messages.length <= 1
    ) {
      const autoTitle =
        dto.content.slice(0, 50) + (dto.content.length > 50 ? '...' : '');
      await this.chatService.updateSession(id, userId, { title: autoTitle });
      this.logger.info('CHAT_AUTO_TITLE', `Session auto-titled: ${autoTitle}`, {
        sessionId: id,
      });
    }

    // Get chat history for context (reuse fetched session)
    const history = currentSession.messages.slice(-10).map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    }));

    // RAG: auto-search all READY documents using semantic similarity
    let contextChunks: {
      content: string;
      documentTitle?: string;
      score?: number;
    }[] = [];
    try {
      this.logger.info(
        'CHAT_RAG',
        `Auto-searching across all READY documents`,
        { userId },
      );

      // 1. Get all READY documents for this user
      const docs = await this.prisma.document.findMany({
        where: { userId, status: 'READY' },
        select: { id: true, title: true },
      });

      if (docs.length > 0) {
        // 2. Get all chunks from those documents
        const allChunks = await this.prisma.documentChunk.findMany({
          where: { documentId: { in: docs.map((d) => d.id) } },
          include: { document: { select: { title: true } } },
        });

        if (allChunks.length > 0) {
          this.logger.debug(
            'CHAT_RAG',
            `Found ${allChunks.length} chunks across ${docs.length} documents`,
          );

          // 3. Embed the user query
          const queryEmbedding = await this.localEmbedding.getEmbedding(
            dto.content,
          );

          // 4. Score chunks by cosine similarity
          const scored = allChunks.map((chunk) => {
            let similarity = 0;
            if (chunk.embedding) {
              try {
                const chunkVec = JSON.parse(chunk.embedding);
                similarity = cosineSimilarity(queryEmbedding, chunkVec);
              } catch {
                /* skip */
              }
            }
            return {
              content: chunk.content,
              documentTitle: chunk.document.title,
              score: similarity,
            };
          });

          // 5. Sort by similarity, take top 10
          scored.sort((a, b) => b.score - a.score);
          contextChunks = scored.slice(0, 10);

          this.logger.info(
            'CHAT_RAG',
            `Top chunk similarity: ${(contextChunks[0]?.score || 0).toFixed(4)}`,
            {
              topScore: contextChunks[0]?.score,
              documentsUsed: docs.map((d) => d.title),
            },
          );
        }
      } else {
        this.logger.info('CHAT_RAG', `No READY documents found for user`, {
          userId,
        });
      }
    } catch (err: any) {
      this.logger.error('CHAT_RAG', `Auto-RAG failed: ${err.message}`, {
        error: err.message,
      });
    }

    // Generate AI response with RAG
    let assistantReply: string;
    try {
      this.logger.info('CHAT_AI_CALL', `Calling AI model for response`, {
        contextChunksCount: contextChunks.length,
        historyLength: history.length,
      });
      const response = await this.aiService.ragChat(
        dto.content,
        contextChunks,
        history,
      );
      assistantReply = response.content;
      this.logger.info(
        'CHAT_AI_CALL',
        `AI response received (${assistantReply.length} chars)`,
        {
          responseLength: assistantReply.length,
        },
      );
    } catch (error: any) {
      this.logger.error('CHAT_AI_CALL', `AI Error: ${error?.message}`, {
        error: error?.message,
      });
      assistantReply = `⚠️ AI Error: ${error?.message || 'Unknown error'}`;
    }

    const saved = await this.chatService.saveMessage(
      id,
      'ASSISTANT',
      assistantReply,
    );
    this.logger.debug('CHAT_SEND_MESSAGE', `Assistant message saved`, {
      sessionId: id,
      messageId: saved.id,
    });
    return saved;
  }
}

import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatSessionDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}

  @Post('sessions')
  createSession(@CurrentUser('id') userId: string, @Body() dto: CreateChatSessionDto) {
    return this.chatService.createSession(userId, dto.title);
  }

  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    return this.chatService.getSessions(userId);
  }

  @Get('sessions/:id')
  getSession(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.chatService.getSession(id, userId);
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.chatService.deleteSession(id, userId);
  }

  @Get('sessions/:id/messages')
  getMessages(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.chatService.getMessages(id, userId);
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    // Save user message
    await this.chatService.saveMessage(id, 'USER', dto.content);

    // Get chat history for context
    const session = await this.chatService.getSession(id, userId);
    const history = session.messages.slice(-10).map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    }));

    // RAG: get relevant chunks from specified documents
    let contextChunks: { content: string; documentTitle?: string }[] = [];
    if (dto.documentIds && dto.documentIds.length > 0) {
      const chunks = await this.prisma.documentChunk.findMany({
        where: { documentId: { in: dto.documentIds } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { document: { select: { title: true } } },
      });
      contextChunks = chunks.map((c) => ({
        content: c.content,
        documentTitle: c.document.title,
      }));
    }

    // Generate AI response with RAG
    let assistantReply: string;
    try {
      const response = await this.aiService.ragChat(dto.content, contextChunks, history);
      assistantReply = response.content;
    } catch (error: any) {
      assistantReply = `⚠️ AI Error: ${error?.message || 'Unknown error'}`;
    }

    const saved = await this.chatService.saveMessage(id, 'ASSISTANT', assistantReply);
    return saved;
  }
}

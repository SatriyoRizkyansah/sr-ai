import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, DocumentsModule, ChatModule, AiModule, LoggerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

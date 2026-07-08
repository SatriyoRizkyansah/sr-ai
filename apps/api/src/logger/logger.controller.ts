import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LoggerController {
  constructor(private loggerService: LoggerService) {}

  @Get()
  getLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.loggerService.getLogs({
      level,
      limit: limit ? parseInt(limit, 10) : undefined,
      action,
    });
  }

  @Delete()
  clearLogs() {
    this.loggerService.clear();
    return { message: 'Logs cleared' };
  }
}

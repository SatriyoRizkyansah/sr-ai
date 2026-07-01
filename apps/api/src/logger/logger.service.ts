import { Injectable } from '@nestjs/common';
import { LogEntry } from './interfaces/log-entry.interface';

@Injectable()
export class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private counter = 0;

  log(level: LogEntry['level'], action: string, message: string, metadata?: Record<string, any>) {
    this.counter++;
    const entry: LogEntry = {
      id: `log-${this.counter}`,
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
      metadata,
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    // Also output to console for terminal viewing
    const prefix = `[${entry.timestamp}] [${level}] [${action}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`, metadata ? JSON.stringify(metadata) : '');
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${message}`, metadata ? JSON.stringify(metadata) : '');
    } else {
      console.log(`${prefix} ${message}`, metadata ? JSON.stringify(metadata) : '');
    }
    return entry;
  }

  info(action: string, message: string, metadata?: Record<string, any>) {
    return this.log('INFO', action, message, metadata);
  }

  warn(action: string, message: string, metadata?: Record<string, any>) {
    return this.log('WARN', action, message, metadata);
  }

  error(action: string, message: string, metadata?: Record<string, any>) {
    return this.log('ERROR', action, message, metadata);
  }

  debug(action: string, message: string, metadata?: Record<string, any>) {
    return this.log('DEBUG', action, message, metadata);
  }

  getLogs(options?: { level?: string; limit?: number; action?: string }) {
    let filtered = [...this.logs];
    if (options?.level) {
      filtered = filtered.filter((l) => l.level === options.level);
    }
    if (options?.action) {
      filtered = filtered.filter((l) => l.action.includes(options.action!));
    }
    const limit = options?.limit || 100;
    return filtered.slice(0, limit);
  }

  clear() {
    this.logs = [];
  }
}

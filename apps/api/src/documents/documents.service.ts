import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { LocalEmbeddingService } from '../ai/local-embedding.service';
import { LoggerService } from '../logger/logger.service';
import { QueryDocumentsDto } from './dto/documents.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private localEmbedding: LocalEmbeddingService,
    private logger: LoggerService,
  ) {}

  async create(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('File is required');

    this.logger.info('DOCUMENT_UPLOAD', `Starting upload: ${file.originalname}`, {
      mimeType: file.mimetype,
      size: file.size,
      userId,
    });

    const document = await this.prisma.document.create({
      data: {
        title: file.originalname,
        filename: file.filename || file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        userId,
        status: 'PROCESSING',
      },
    });

    this.logger.info('DOCUMENT_UPLOAD', `File saved to DB: ${document.id}`, {
      documentId: document.id,
      filename: file.filename,
    });

    // Process document asynchronously (don't await — let it happen in background)
    this.processDocument(document.id, file).catch((err) => {
      this.logger.error('DOCUMENT_PROCESS', `Background processing failed: ${err.message}`, {
        documentId: document.id,
        error: err.message,
      });
    });

    return document;
  }

  private async processDocument(documentId: string, file: Express.Multer.File) {
    const filePath = path.join(process.cwd(), 'uploads', file.filename);

    this.logger.info('DOCUMENT_PROCESS', `Step 1/4: Extracting text from ${file.originalname}`, {
      documentId,
      mimeType: file.mimetype,
      filePath,
    });

    // Step 1: Extract text
    let text: string;
    try {
      text = await this.extractText(filePath, file.mimetype);
    } catch (err: any) {
      this.logger.error('DOCUMENT_PROCESS', `Text extraction failed: ${err.message}`, {
        documentId,
        error: err.message,
      });
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
      return;
    }

    if (!text || text.trim().length === 0) {
      this.logger.warn('DOCUMENT_PROCESS', 'No text content found in document', { documentId });
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
      return;
    }

    this.logger.info('DOCUMENT_PROCESS', `Step 2/4: Text extracted (${text.length} chars)`, {
      documentId,
      charCount: text.length,
    });

    // Step 2: Chunk the text
    const chunks = this.chunkText(text);
    this.logger.info('DOCUMENT_PROCESS', `Step 3/4: Text split into ${chunks.length} chunks`, {
      documentId,
      chunkCount: chunks.length,
    });

    // Step 3: Generate embeddings and save chunks
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      try {
        this.logger.debug('DOCUMENT_PROCESS', `Generating embedding for chunk ${i + 1}/${chunks.length}`, {
          documentId,
          chunkIndex: i,
          chunkLength: chunks[i].length,
        });

        this.logger.debug('DOCUMENT_EMBED', `Using local embedding model for chunk ${i + 1}`, { documentId });
        const embedding = await this.localEmbedding.getEmbedding(chunks[i]);

        await this.prisma.documentChunk.create({
          data: {
            content: chunks[i],
            embedding: JSON.stringify(embedding),
            pageNumber: null,
            documentId,
          },
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        this.logger.error('DOCUMENT_PROCESS', `Failed to process chunk ${i + 1}: ${err.message}`, {
          documentId,
          chunkIndex: i,
          error: err.message,
        });
      }
    }

    // Step 4: Update document status
    if (successCount > 0) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'READY' },
      });
      this.logger.info('DOCUMENT_PROCESS', `Step 4/4: Processing complete! Status: READY`, {
        documentId,
        chunksCreated: successCount,
        chunksFailed: failCount,
      });
    } else {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
      this.logger.error('DOCUMENT_PROCESS', `Step 4/4: Processing failed — zero chunks created`, {
        documentId,
      });
    }
  }

  private async extractText(filePath: string, mimeType: string): Promise<string> {
    this.logger.debug('TEXT_EXTRACT', `Reading file: ${filePath}`, { mimeType });

    if (mimeType === 'application/pdf') {
      // PDF extraction using pdfjs-dist (ESM) — use new Function to bypass TS transpilation to require()
      const buffer = await fs.readFile(filePath);
      this.logger.debug('TEXT_EXTRACT', `PDF buffer read: ${buffer.length} bytes`);
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      const pdfjs = await dynamicImport('pdfjs-dist');
      const loadingTask = pdfjs.getDocument({ data: buffer.buffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str || '');
        fullText += strings.join(' ') + '\n';
      }
      return fullText;
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // DOCX extraction using mammoth
      const mammoth = require('mammoth');
      const buffer = await fs.readFile(filePath);
      this.logger.debug('TEXT_EXTRACT', `DOCX buffer read: ${buffer.length} bytes`);
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      const content = await fs.readFile(filePath, 'utf-8');
      this.logger.debug('TEXT_EXTRACT', `Text/MD file read: ${content.length} chars`);
      return content;
    }

    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  private chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];

    let currentChunk = '';
    for (const sentence of sentences) {
      const trimmed = sentence.trim();

      // If a single sentence is longer than maxChunkSize, split it by characters
      if (trimmed.length > maxChunkSize) {
        // Flush current chunk first
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }

        // Split long sentence into character-based chunks
        let remaining = trimmed;
        while (remaining.length > maxChunkSize) {
          const splitPoint = remaining.lastIndexOf(' ', maxChunkSize);
          const end = splitPoint > 0 ? splitPoint : maxChunkSize;
          chunks.push(remaining.slice(0, end).trim());
          remaining = remaining.slice(end - overlap);
        }
        if (remaining.trim().length > 0) {
          currentChunk = remaining.trim();
        } else {
          currentChunk = '';
        }
        continue;
      }

      // If adding this sentence would exceed the limit, save and start new chunk
      if (currentChunk.length + trimmed.length > maxChunkSize && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        // Keep last 'overlap' characters for context
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + ' ' + trimmed;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      }
    }

    // Push the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // Merge very small chunks (less than 100 chars) with the previous one
    const merged: string[] = [];
    for (const chunk of chunks) {
      if (merged.length > 0 && chunk.length < 100) {
        merged[merged.length - 1] += ' ' + chunk;
      } else {
        merged.push(chunk);
      }
    }

    return merged.filter((c) => c.length > 0);
  }

  async findAll(userId: string, query: QueryDocumentsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { filename: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;

    this.logger.debug('DOCUMENT_LIST', `Fetching documents page ${page}/${limit}`, {
      userId,
      status: query.status || 'all',
    });

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data: documents, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    this.logger.debug('DOCUMENT_GET', `Fetching document ${id}`, { userId });
    const doc = await this.prisma.document.findFirst({
      where: { id, userId },
      include: { chunks: { select: { id: true, content: true, pageNumber: true }, take: 20 } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(id: string, userId: string) {
    this.logger.info('DOCUMENT_DELETE', `Deleting document ${id}`, { userId });
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id } });
    this.logger.info('DOCUMENT_DELETE', `Document deleted: ${doc.title}`, { documentId: id });
    return { message: 'Document deleted successfully' };
  }
}

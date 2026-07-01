import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryDocumentsDto } from './dto/documents.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('File is required');
    return this.prisma.document.create({
      data: {
        title: file.originalname,
        filename: file.filename || file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        userId,
        status: 'PROCESSING',
      },
    });
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
    const doc = await this.prisma.document.findFirst({
      where: { id, userId },
      include: { chunks: { select: { id: true, content: true, pageNumber: true }, take: 20 } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async remove(id: string, userId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted successfully' };
  }
}

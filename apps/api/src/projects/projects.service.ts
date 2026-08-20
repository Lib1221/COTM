import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';
import { Prisma, ProjectStatus } from '@prisma/client';

const ALLOWED_SORT = new Set([
  'name',
  'code',
  'clientName',
  'startDate',
  'endDate',
  'budget',
  'status',
  'createdAt',
]);

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private sortField(field?: string): string {
    return field && ALLOWED_SORT.has(field) ? field : 'createdAt';
  }

  async findAll(query: QueryProjectDto) {
    const {
      search,
      status,
      page = 1,
      pageSize = 10,
      sortBy,
      sortOrder,
    } = query;
    const where: Prisma.ProjectWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    const orderBy = {
      [this.sortField(sortBy)]: sortOrder === 'asc' ? 'asc' : 'desc',
    } as Prisma.ProjectOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          progressRecords: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { progressPercent: true, date: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: data.map((p) => ({
        ...p,
        latestProgress: p.progressRecords[0]?.progressPercent ?? 0,
        progressRecords: undefined,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        boqItems: { orderBy: { createdAt: 'asc' } },
        progressRecords: { orderBy: { date: 'desc' } },
        inventoryTransactions: {
          orderBy: { date: 'desc' },
          include: { material: true },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    const boqValue = project.boqItems.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    return {
      ...project,
      boqValue,
      latestProgress: project.progressRecords[0]?.progressPercent ?? 0,
    };
  }

  async create(dto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { code: dto.code },
    });
    if (existing)
      throw new ConflictException(`Project code ${dto.code} already exists`);
    return this.prisma.project.create({
      data: {
        name: dto.name,
        code: dto.code,
        clientName: dto.clientName,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        budget: dto.budget,
        status: dto.status ?? ProjectStatus.PLANNED,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    if (
      dto.code &&
      dto.code !==
        (await this.prisma.project.findUnique({ where: { id } }))?.code
    ) {
      const dup = await this.prisma.project.findUnique({
        where: { code: dto.code },
      });
      if (dup && dup.id !== id)
        throw new ConflictException(`Project code ${dto.code} already exists`);
    }
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.clientName !== undefined && { clientName: dto.clientName }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.startDate !== undefined && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
    return { id };
  }
}

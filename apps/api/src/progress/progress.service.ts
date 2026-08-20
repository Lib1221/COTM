import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async listByProject(projectId: string) {
    await this.ensureProject(projectId);
    const records = await this.prisma.progressRecord.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });
    return {
      data: records,
      latestProgress: records[0]?.progressPercent ?? 0,
    };
  }

  async create(projectId: string, dto: CreateProgressDto) {
    await this.ensureProject(projectId);
    return this.prisma.progressRecord.create({
      data: {
        projectId,
        date: new Date(dto.date),
        description: dto.description,
        progressPercent: dto.progressPercent,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, dto: UpdateProgressDto) {
    const existing = await this.prisma.progressRecord.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Progress record ${id} not found`);
    return this.prisma.progressRecord.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.progressPercent !== undefined && {
          progressPercent: dto.progressPercent,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.progressRecord.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Progress record ${id} not found`);
    await this.prisma.progressRecord.delete({ where: { id } });
    return { id };
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }
}

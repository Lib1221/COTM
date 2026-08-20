import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoqItemDto } from './dto/create-boq-item.dto';
import { UpdateBoqItemDto } from './dto/update-boq-item.dto';

function computeTotal(quantity: number, unitPrice: number): number {
  return Number((quantity * unitPrice).toFixed(2));
}

@Injectable()
export class BoqService {
  constructor(private prisma: PrismaService) {}

  async listByProject(projectId: string) {
    await this.ensureProject(projectId);
    const items = await this.prisma.boqItem.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    const totalValue = items.reduce((sum, i) => sum + Number(i.total), 0);
    return { items, totalValue };
  }

  async create(projectId: string, dto: CreateBoqItemDto) {
    await this.ensureProject(projectId);
    return this.prisma.boqItem.create({
      data: {
        projectId,
        description: dto.description,
        unit: dto.unit,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        total: computeTotal(dto.quantity, dto.unitPrice),
      },
    });
  }

  async update(id: string, dto: UpdateBoqItemDto) {
    const existing = await this.prisma.boqItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`BOQ item ${id} not found`);
    const quantity = dto.quantity ?? Number(existing.quantity);
    const unitPrice = dto.unitPrice ?? Number(existing.unitPrice);
    return this.prisma.boqItem.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
        total: computeTotal(quantity, unitPrice),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.boqItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`BOQ item ${id} not found`);
    await this.prisma.boqItem.delete({ where: { id } });
    return { id };
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockInDto, StockOutDto } from './dto/stock-transaction.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { InventoryTxType, Prisma } from '@prisma/client';

const ALLOWED_SORT = new Set(['date', 'quantity', 'createdAt', 'type']);

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private sortField(field?: string): string {
    return field && ALLOWED_SORT.has(field) ? field : 'date';
  }

  async findAll(query: QueryInventoryDto) {
    const {
      materialId,
      projectId,
      type,
      fromDate,
      toDate,
      page = 1,
      pageSize = 10,
      sortBy,
      sortOrder,
    } = query;
    const where: Prisma.InventoryTransactionWhereInput = {};
    if (materialId) where.materialId = materialId;
    if (projectId) where.projectId = projectId;
    if (type) where.type = type;
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }
    const orderBy = {
      [this.sortField(sortBy)]: sortOrder === 'asc' ? 'asc' : 'desc',
    } as Prisma.InventoryTransactionOrderByWithRelationInput;

    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          material: {
            select: { id: true, name: true, code: true, unit: true },
          },
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async stockIn(dto: StockInDto) {
    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    });
    if (!material)
      throw new NotFoundException(`Material ${dto.materialId} not found`);

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          materialId: dto.materialId,
          type: InventoryTxType.STOCK_IN,
          quantity: dto.quantity,
          date: new Date(dto.date),
          reference: dto.reference,
        },
        include: { material: true },
      });
      const updated = await tx.material.update({
        where: { id: dto.materialId },
        data: { currentStock: { increment: dto.quantity } },
      });
      return {
        ...transaction,
        material: {
          ...transaction.material,
          currentStock: updated.currentStock,
          isLowStock:
            Number(updated.currentStock) <= Number(updated.minimumStock),
        },
      };
    });
  }

  async stockOut(dto: StockOutDto) {
    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    });
    if (!material)
      throw new NotFoundException(`Material ${dto.materialId} not found`);
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project)
      throw new NotFoundException(`Project ${dto.projectId} not found`);

    return this.prisma.$transaction(async (tx) => {
      // Atomic conditional decrement: only succeeds while enough stock exists,
      // preventing a TOCTOU race between the availability check and the update.
      const result = await tx.material.updateMany({
        where: { id: dto.materialId, currentStock: { gte: dto.quantity } },
        data: { currentStock: { decrement: dto.quantity } },
      });
      if (result.count === 0) {
        const current = await tx.material.findUnique({
          where: { id: dto.materialId },
          select: { currentStock: true },
        });
        const available = Number(current?.currentStock ?? 0);
        throw new BadRequestException(
          `Stock out quantity (${dto.quantity}) exceeds available stock (${available}) for material "${material.name}"`,
        );
      }

      const transaction = await tx.inventoryTransaction.create({
        data: {
          materialId: dto.materialId,
          projectId: dto.projectId,
          type: InventoryTxType.STOCK_OUT,
          quantity: dto.quantity,
          date: new Date(dto.date),
          reference: dto.reference,
        },
        include: {
          material: true,
          project: { select: { id: true, name: true, code: true } },
        },
      });
      return {
        ...transaction,
        material: {
          ...transaction.material,
          isLowStock:
            Number(transaction.material.currentStock) <=
            Number(transaction.material.minimumStock),
        },
      };
    });
  }
}

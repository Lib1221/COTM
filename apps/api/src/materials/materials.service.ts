import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
import { InventoryTxType, Prisma } from '@prisma/client';

const ALLOWED_SORT = new Set([
  'name',
  'code',
  'unit',
  'currentStock',
  'minimumStock',
  'createdAt',
]);

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  private sortField(field?: string): string {
    return field && ALLOWED_SORT.has(field) ? field : 'createdAt';
  }

  async findAll(query: QueryMaterialDto) {
    const {
      search,
      lowStock,
      page = 1,
      pageSize = 10,
      sortBy,
      sortOrder,
    } = query;
    const where: Prisma.MaterialWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const orderBy = {
      [this.sortField(sortBy)]: sortOrder === 'asc' ? 'asc' : 'desc',
    } as Prisma.MaterialOrderByWithRelationInput;

    // Low-stock requires comparing two columns; handle in memory.
    if (lowStock) {
      const all = await this.prisma.material.findMany({ where, orderBy });
      const filtered = all.filter(
        (m) => Number(m.currentStock) <= Number(m.minimumStock),
      );
      const start = (page - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);
      return {
        data: data.map((m) => ({
          ...m,
          isLowStock: true,
        })),
        meta: {
          total: filtered.length,
          page,
          pageSize,
          totalPages: Math.ceil(filtered.length / pageSize),
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      data: data.map((m) => ({
        ...m,
        isLowStock: Number(m.currentStock) <= Number(m.minimumStock),
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findLowStock() {
    const materials = await this.prisma.material.findMany();
    const lowStock = materials.filter(
      (m) => Number(m.currentStock) <= Number(m.minimumStock),
    );
    return {
      data: lowStock.map((m) => ({
        ...m,
        isLowStock: true,
      })),
      total: lowStock.length,
    };
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) throw new NotFoundException(`Material ${id} not found`);
    return {
      ...material,
      isLowStock:
        Number(material.currentStock) <= Number(material.minimumStock),
    };
  }

  async create(dto: CreateMaterialDto) {
    const existing = await this.prisma.material.findUnique({
      where: { code: dto.code },
    });
    if (existing)
      throw new ConflictException(`Material code ${dto.code} already exists`);

    const initialStock = dto.currentStock ?? 0;
    return this.prisma.$transaction(async (tx) => {
      const material = await tx.material.create({
        data: {
          name: dto.name,
          code: dto.code,
          unit: dto.unit,
          currentStock: initialStock,
          minimumStock: dto.minimumStock ?? 0,
        },
      });
      if (initialStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            materialId: material.id,
            type: InventoryTxType.STOCK_IN,
            quantity: initialStock,
            date: new Date(),
            reference: 'INITIAL',
          },
        });
      }
      return {
        ...material,
        isLowStock:
          Number(material.currentStock) <= Number(material.minimumStock),
      };
    });
  }

  async update(id: string, dto: UpdateMaterialDto) {
    await this.findOne(id);
    if (dto.code) {
      const dup = await this.prisma.material.findUnique({
        where: { code: dto.code },
      });
      if (dup && dup.id !== id)
        throw new ConflictException(`Material code ${dto.code} already exists`);
    }
    const updated = await this.prisma.material.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.minimumStock !== undefined && {
          minimumStock: dto.minimumStock,
        }),
      },
    });
    return {
      ...updated,
      isLowStock: Number(updated.currentStock) <= Number(updated.minimumStock),
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.material.delete({ where: { id } });
  }
}

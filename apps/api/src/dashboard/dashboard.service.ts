import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalProjects,
      ongoingProjects,
      completedProjects,
      totalMaterials,
      lowStockMaterials,
      projects,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: ProjectStatus.ONGOING } }),
      this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.prisma.material.count(),
      this.prisma.material.findMany(),
      this.prisma.project.findMany({
        include: {
          boqItems: { select: { total: true } },
          progressRecords: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { progressPercent: true },
          },
        },
      }),
    ]);

    const lowStock = lowStockMaterials.filter(
      (m) => Number(m.currentStock) <= Number(m.minimumStock),
    );

    const projectPerformance = projects.map((p) => {
      const boqValue = p.boqItems.reduce(
        (sum, item) => sum + Number(item.total),
        0,
      );
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        budget: Number(p.budget),
        boqValue,
        progressPercent: p.progressRecords[0]?.progressPercent ?? 0,
        status: p.status,
      };
    });

    return {
      projects: {
        total: totalProjects,
        ongoing: ongoingProjects,
        completed: completedProjects,
      },
      inventory: {
        totalMaterials,
        lowStockCount: lowStock.length,
        lowStock: lowStock.map((m) => ({
          id: m.id,
          name: m.name,
          code: m.code,
          unit: m.unit,
          currentStock: Number(m.currentStock),
          minimumStock: Number(m.minimumStock),
        })),
      },
      projectPerformance,
    };
  }
}

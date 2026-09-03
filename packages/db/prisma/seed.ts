import {
  PrismaClient,
  ProjectStatus,
  InventoryTxType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_REFERENCES = ['PO-2026-0001', 'ISS-2026-0001', 'INITIAL'];

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'admin12345',
    10,
  );
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cms.test' },
    update: {},
    create: {
      email: 'admin@cms.test',
      name: 'Site Admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log('Seeded admin user:', admin.email);

  const project = await prisma.project.upsert({
    where: { code: 'PRJ-001' },
    update: {
      name: 'Sample Residential Building',
      clientName: 'Acme Holdings',
      location: 'Addis Ababa, Ethiopia',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-12-31'),
      budget: 12_500_000,
      status: ProjectStatus.ONGOING,
    },
    create: {
      code: 'PRJ-001',
      name: 'Sample Residential Building',
      clientName: 'Acme Holdings',
      location: 'Addis Ababa, Ethiopia',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-12-31'),
      budget: 12_500_000,
      status: ProjectStatus.ONGOING,
    },
  });

  const warehouse = await prisma.project.upsert({
    where: { code: 'PRJ-002' },
    update: {
      name: 'Warehouse Extension',
      status: ProjectStatus.COMPLETED,
    },
    create: {
      code: 'PRJ-002',
      name: 'Warehouse Extension',
      clientName: 'Blue Nile Logistics',
      location: 'Adama, Ethiopia',
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-11-30'),
      budget: 4_200_000,
      status: ProjectStatus.COMPLETED,
    },
  });

  await prisma.boqItem.deleteMany({
    where: { projectId: { in: [project.id, warehouse.id] } },
  });
  await prisma.progressRecord.deleteMany({
    where: { projectId: { in: [project.id, warehouse.id] } },
  });
  await prisma.inventoryTransaction.deleteMany({
    where: { reference: { in: SEED_REFERENCES } },
  });

  const boqItems = [
    {
      description: 'Foundation concrete (m³)',
      unit: 'm³',
      quantity: 120,
      unitPrice: 3500,
    },
    {
      description: 'Reinforcement steel (kg)',
      unit: 'kg',
      quantity: 8500,
      unitPrice: 95,
    },
    {
      description: 'Brickwork (m²)',
      unit: 'm²',
      quantity: 1450,
      unitPrice: 620,
    },
    {
      description: 'Plastering (m²)',
      unit: 'm²',
      quantity: 2900,
      unitPrice: 180,
    },
  ];

  for (const item of boqItems) {
    const total = Number(item.quantity) * Number(item.unitPrice);
    await prisma.boqItem.create({
      data: {
        projectId: project.id,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
      },
    });
  }

  await prisma.boqItem.create({
    data: {
      projectId: warehouse.id,
      description: 'Steel frame (kg)',
      unit: 'kg',
      quantity: 12000,
      unitPrice: 90,
      total: 1_080_000,
    },
  });

  const materials = [
    {
      name: 'Cement',
      code: 'MAT-CEM',
      unit: 'bag',
      currentStock: 500,
      minimumStock: 100,
    },
    {
      name: 'Steel',
      code: 'MAT-STL',
      unit: 'kg',
      currentStock: 7500,
      minimumStock: 2000,
    },
    {
      name: 'Sand',
      code: 'MAT-SND',
      unit: 'm³',
      currentStock: 30,
      minimumStock: 50,
    },
    {
      name: 'Gravel',
      code: 'MAT-GRV',
      unit: 'm³',
      currentStock: 45,
      minimumStock: 40,
    },
    {
      name: 'Brick',
      code: 'MAT-BRK',
      unit: 'pcs',
      currentStock: 12000,
      minimumStock: 3000,
    },
  ];

  const materialIds: Record<string, string> = {};
  for (const m of materials) {
    const row = await prisma.material.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        unit: m.unit,
        currentStock: m.currentStock,
        minimumStock: m.minimumStock,
      },
      create: m,
    });
    materialIds[m.code] = row.id;
  }

  await prisma.inventoryTransaction.createMany({
    data: [
      {
        materialId: materialIds['MAT-CEM'],
        type: InventoryTxType.STOCK_IN,
        quantity: 500,
        date: new Date('2026-08-18'),
        reference: 'PO-2026-0001',
      },
      {
        materialId: materialIds['MAT-STL'],
        type: InventoryTxType.STOCK_IN,
        quantity: 8000,
        date: new Date('2026-08-18'),
        reference: 'PO-2026-0001',
      },
      {
        materialId: materialIds['MAT-STL'],
        projectId: project.id,
        type: InventoryTxType.STOCK_OUT,
        quantity: 500,
        date: new Date('2026-08-21'),
        reference: 'ISS-2026-0001',
      },
    ],
  });

  await prisma.progressRecord.create({
    data: {
      projectId: project.id,
      date: new Date('2026-08-19'),
      description: 'Foundation work completed',
      progressPercent: 35,
      notes: 'Concrete poured and cured for the main foundation.',
    },
  });

  await prisma.progressRecord.create({
    data: {
      projectId: warehouse.id,
      date: new Date('2025-11-30'),
      description: 'Handover completed',
      progressPercent: 100,
      notes: 'Client accepted the warehouse extension.',
    },
  });

  console.log('Seed completed for projects:', project.code, warehouse.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, ProjectStatus, InventoryTxType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // -------- Project --------
  const project = await prisma.project.upsert({
    where: { code: 'PRJ-001' },
    update: {},
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

  // -------- BOQ items --------
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

  // -------- Materials --------
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
      currentStock: 8000,
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

  for (const m of materials) {
    await prisma.material.upsert({
      where: { code: m.code },
      update: {},
      create: m,
    });
  }

  // -------- Inventory: stock in for Cement --------
  const cement = await prisma.material.findUniqueOrThrow({
    where: { code: 'MAT-CEM' },
  });
  await prisma.inventoryTransaction.create({
    data: {
      materialId: cement.id,
      type: InventoryTxType.STOCK_IN,
      quantity: 500,
      date: new Date('2026-08-18'),
      reference: 'PO-2026-0001',
    },
  });

  // -------- Progress record --------
  await prisma.progressRecord.create({
    data: {
      projectId: project.id,
      date: new Date('2026-08-19'),
      description: 'Foundation work completed',
      progressPercent: 35,
      notes: 'Concrete poured and cured for the main foundation.',
    },
  });

  console.log('Seed completed for project:', project.code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

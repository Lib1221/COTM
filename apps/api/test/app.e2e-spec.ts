import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Construction Management System (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.inventoryTransaction.deleteMany();
    await prisma.boqItem.deleteMany();
    await prisma.progressRecord.deleteMany();
    await prisma.project.deleteMany();
    await prisma.material.deleteMany();
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health should return ok', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Projects', () => {
    let projectId: string;

    it('POST /api/projects should create a project', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .send({
          name: 'E2E Test Project',
          code: 'E2E-001',
          clientName: 'Test Client',
          location: 'Test Location',
          startDate: '2026-08-20',
          endDate: '2026-12-31',
          budget: 1000000,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Project');
      expect(res.body.code).toBe('E2E-001');
      expect(res.body.status).toBe('PLANNED');
      projectId = res.body.id;
    });

    it('POST /api/projects should reject duplicate code', () => {
      return request(app.getHttpServer())
        .post('/api/projects')
        .send({
          name: 'Duplicate Project',
          code: 'E2E-001',
          clientName: 'Test Client',
          location: 'Test Location',
          startDate: '2026-08-20',
          budget: 1000000,
        })
        .expect(409);
    });

    it('POST /api/projects should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/projects')
        .send({ name: 'Incomplete' })
        .expect(400);
    });

    it('GET /api/projects/:id should return project details', () => {
      return request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(projectId);
          expect(res.body).toHaveProperty('boqItems');
          expect(res.body).toHaveProperty('boqValue');
        });
    });

    describe('BOQ', () => {
      let boqItemId: string;

      it('POST /api/projects/:projectId/boq should calculate total = qty x unitPrice', async () => {
        const res = await request(app.getHttpServer())
          .post(`/api/projects/${projectId}/boq`)
          .send({
            description: 'Concrete work (m³)',
            unit: 'm³',
            quantity: 100,
            unitPrice: 500,
          })
          .expect(201);

        expect(Number(res.body.total)).toBe(50000);
        boqItemId = res.body.id;
      });

      it('PATCH /api/projects/:projectId/boq/:id should recalculate total', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/api/projects/${projectId}/boq/${boqItemId}`)
          .send({ quantity: 150 })
          .expect(200);

        expect(Number(res.body.total)).toBe(75000);
      });

      it('GET /api/projects/:projectId/boq should return total value', () => {
        return request(app.getHttpServer())
          .get(`/api/projects/${projectId}/boq`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('totalValue');
            expect(Number(res.body.totalValue)).toBe(75000);
          });
      });
    });

    describe('Progress', () => {
      it('POST /api/projects/:projectId/progress should record progress', async () => {
        const res = await request(app.getHttpServer())
          .post(`/api/projects/${projectId}/progress`)
          .send({
            date: '2026-08-20',
            description: 'Foundation completed',
            progressPercent: 35,
            notes: 'Concrete poured',
          })
          .expect(201);

        expect(res.body.progressPercent).toBe(35);
      });

      it('GET /api/projects/:id should show latest progress', () => {
        return request(app.getHttpServer())
          .get(`/api/projects/${projectId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.latestProgress).toBe(35);
          });
      });

      it('POST /api/projects/:projectId/progress should reject % > 100', () => {
        return request(app.getHttpServer())
          .post(`/api/projects/${projectId}/progress`)
          .send({
            date: '2026-08-21',
            description: 'Invalid',
            progressPercent: 150,
          })
          .expect(400);
      });
    });
  });

  describe('Materials & Inventory', () => {
    let materialId: string;
    let projectId: string;

    beforeAll(async () => {
      const material = await request(app.getHttpServer())
        .post('/api/materials')
        .send({
          name: 'Test Cement',
          code: 'TEST-CEM',
          unit: 'bag',
          currentStock: 100,
          minimumStock: 20,
        })
        .expect(201);
      materialId = material.body.id;

      const project = await request(app.getHttpServer())
        .post('/api/projects')
        .send({
          name: 'Inventory Test Project',
          code: 'INV-001',
          clientName: 'Test Client',
          location: 'Test Location',
          startDate: '2026-08-20',
          budget: 500000,
        })
        .expect(201);
      projectId = project.body.id;
    });

    it('POST /api/inventory/stock-in should increase current stock', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inventory/stock-in')
        .send({
          materialId,
          quantity: 50,
          date: '2026-08-20',
          reference: 'PO-TEST-001',
        })
        .expect(201);

      expect(Number(res.body.material.currentStock)).toBe(150);
    });

    it('POST /api/inventory/stock-out should decrease current stock', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inventory/stock-out')
        .send({
          materialId,
          projectId,
          quantity: 30,
          date: '2026-08-20',
          reference: 'ISS-TEST-001',
        })
        .expect(201);

      expect(Number(res.body.material.currentStock)).toBe(120);
    });

    it('POST /api/inventory/stock-out should reject quantity > available stock', () => {
      return request(app.getHttpServer())
        .post('/api/inventory/stock-out')
        .send({
          materialId,
          projectId,
          quantity: 99999,
          date: '2026-08-20',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('exceeds available stock');
        });
    });

    it('GET /api/materials/low-stock should list low-stock materials', async () => {
      await request(app.getHttpServer())
        .patch(`/api/materials/${materialId}`)
        .send({ minimumStock: 200 })
        .expect(200);

      return request(app.getHttpServer())
        .get('/api/materials/low-stock')
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBeGreaterThan(0);
        });
    });
  });

  describe('Dashboard', () => {
    it('GET /api/dashboard should return overview', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('projects');
          expect(res.body).toHaveProperty('inventory');
          expect(res.body).toHaveProperty('projectPerformance');
          expect(res.body.projects).toHaveProperty('total');
          expect(res.body.projects).toHaveProperty('ongoing');
          expect(res.body.projects).toHaveProperty('completed');
        });
    });
  });
});

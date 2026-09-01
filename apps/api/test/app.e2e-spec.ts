/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { PrismaExceptionFilter } from './../src/common/prisma-exception.filter';

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
    app.useGlobalFilters(new PrismaExceptionFilter());
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

    it('PATCH /api/projects/:id should update a project', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/projects/${projectId}`)
        .send({ status: 'ONGOING', location: 'Updated Location' })
        .expect(200);
      expect(res.body.status).toBe('ONGOING');
      expect(res.body.location).toBe('Updated Location');
    });

    it('GET /api/projects should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/projects?page=1&pageSize=2')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.pageSize).toBe(2);
          expect(res.body.data.length).toBeLessThanOrEqual(2);
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

      it('PATCH /api/projects/:other/boq/:id should reject cross-project update', async () => {
        const other = await request(app.getHttpServer())
          .post('/api/projects')
          .send({
            name: 'Other Project',
            code: 'E2E-OTHER',
            clientName: 'Client',
            location: 'Loc',
            startDate: '2026-08-20',
            budget: 100000,
          })
          .expect(201);
        return request(app.getHttpServer())
          .patch(`/api/projects/${other.body.id}/boq/${boqItemId}`)
          .send({ quantity: 1 })
          .expect(404);
      });

      it('DELETE /api/projects/:projectId/boq/:id should remove the BOQ item', () => {
        return request(app.getHttpServer())
          .delete(`/api/projects/${projectId}/boq/${boqItemId}`)
          .expect(204);
      });
    });

    describe('Progress', () => {
      let progressId: string;

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
        progressId = res.body.id;
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

      it('PATCH /api/projects/:projectId/progress/:id should update the record', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/api/projects/${projectId}/progress/${progressId}`)
          .send({ progressPercent: 50, description: 'Updated description' })
          .expect(200);
        expect(res.body.progressPercent).toBe(50);
        expect(res.body.description).toBe('Updated description');
      });

      it('PATCH /api/projects/:other/progress/:id should reject cross-project update', async () => {
        const other = await request(app.getHttpServer())
          .post('/api/projects')
          .send({
            name: 'Other Progress Project',
            code: 'E2E-PROG-OTHER',
            clientName: 'Client',
            location: 'Loc',
            startDate: '2026-08-20',
            budget: 100000,
          })
          .expect(201);
        return request(app.getHttpServer())
          .patch(`/api/projects/${other.body.id}/progress/${progressId}`)
          .send({ progressPercent: 10 })
          .expect(404);
      });

      it('DELETE /api/projects/:projectId/progress/:id should remove the record', () => {
        return request(app.getHttpServer())
          .delete(`/api/projects/${projectId}/progress/${progressId}`)
          .expect(204);
      });
    });

    it('DELETE /api/projects/:id should delete the project', () => {
      return request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .expect(204);
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

    it('GET /api/materials/:id should return a material', () => {
      return request(app.getHttpServer())
        .get(`/api/materials/${materialId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(materialId);
          expect(res.body).toHaveProperty('isLowStock');
        });
    });

    it('PATCH /api/materials/:id should persist currentStock', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/materials/${materialId}`)
        .send({ name: 'Test Cement Updated', currentStock: 500 })
        .expect(200);
      expect(res.body.name).toBe('Test Cement Updated');
      expect(Number(res.body.currentStock)).toBe(500);
      expect(res.body.isLowStock).toBe(false);
    });

    it('GET /api/materials should support search and pagination', () => {
      return request(app.getHttpServer())
        .get('/api/materials?search=Cement&page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.pageSize).toBe(5);
          expect(
            res.body.data.every((m: { name: string }) =>
              m.name.toLowerCase().includes('cement'),
            ),
          ).toBe(true);
        });
    });

    it('GET /api/inventory/transactions should support filter and pagination', () => {
      return request(app.getHttpServer())
        .get(
          `/api/inventory/transactions?materialId=${materialId}&page=1&pageSize=5`,
        )
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.pageSize).toBe(5);
          expect(
            res.body.data.every(
              (t: { materialId: string }) => t.materialId === materialId,
            ),
          ).toBe(true);
        });
    });

    it('DELETE /api/materials/:id should reject when referenced by transactions', () => {
      return request(app.getHttpServer())
        .delete(`/api/materials/${materialId}`)
        .expect(409);
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

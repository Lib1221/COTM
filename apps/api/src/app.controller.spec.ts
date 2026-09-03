import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API metadata', () => {
      expect(appController.getInfo()).toEqual({
        name: 'Liben CMS API',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/api/health',
        live: '/api/health/live',
        ready: '/api/health/ready',
      });
    });
  });
});

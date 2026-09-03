import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Liben CMS API',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/api/health',
      live: '/api/health/live',
      ready: '/api/health/ready',
    };
  }
}

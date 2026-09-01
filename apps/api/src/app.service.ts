import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Construction Management System API',
      docs: '/api/docs',
      health: '/api/health',
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Service health check' })
  getHealth() {
    return {
      status: 'ok',
      service: 'syzy-waitlist',
      version: '0.1.0',
    };
  }
}

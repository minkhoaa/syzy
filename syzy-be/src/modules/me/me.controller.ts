import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

class ContactDto {
  email: string;
}

@ApiTags('me')
@Controller('me')
export class MeController {
  @Post('contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach email to current session' })
  async attachContact(@Body() dto: ContactDto) {
    return { email: dto.email, isContactable: true };
  }
}

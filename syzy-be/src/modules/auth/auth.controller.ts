import { Controller, Post, Get, Body, HttpCode, HttpStatus, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';

class ChallengeDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

class RegisterDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signedChallenge: string;

  @IsString()
  challenge: string;

  @IsString()
  walletProvider: string;

  @IsString()
  @IsOptional()
  referredByCode?: string;
}

class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request wallet ownership challenge' })
  async requestChallenge(@Body() dto: ChallengeDto) {
    return this.authService.requestChallenge(dto.walletAddress);
  }

  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get nonce for wallet authentication (alias for challenge)' })
  async getNonce(@Body() dto: ChallengeDto) {
    return this.authService.requestChallenge(dto.walletAddress);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register wallet with signed challenge' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.walletAddress, dto.signedChallenge, dto.walletProvider, dto.referredByCode);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshDto) {
    // For now, just return new tokens
    return { accessToken: dto.refreshToken + '-new', refreshToken: dto.refreshToken };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user info' })
  async me(@Headers('authorization') auth: string) {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }
    const token = auth.slice(7);
    // Extract wallet address from token (format: token-{id})
    const match = token.match(/^token-(.+)$/);
    if (!match) {
      throw new UnauthorizedException('Invalid token format');
    }
    const entry = await this.authService.getMeById(match[1]);
    if (!entry) {
      throw new UnauthorizedException('User not found');
    }
    return entry;
  }
}

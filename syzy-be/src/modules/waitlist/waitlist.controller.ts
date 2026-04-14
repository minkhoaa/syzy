import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import {
  RegisterWaitlistDto,
  RequestChallengeDto,
  RegisterWalletDto,
  VerifyReferralCodeDto,
  AttachWaitlistContactDto,
} from './waitlist.dto';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register for early access waitlist (email legacy)' })
  async register(@Body() dto: RegisterWaitlistDto) {
    const result = await this.waitlistService.register(dto);
    return { success: true };
  }

  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request wallet ownership challenge' })
  async requestChallenge(@Body() dto: RequestChallengeDto) {
    return this.waitlistService.requestChallenge(dto.walletAddress);
  }

  @Post('register-wallet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register wallet with signed challenge' })
  async registerWallet(@Body() dto: RegisterWalletDto) {
    return this.waitlistService.registerWallet(dto);
  }

  @Patch('contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach contact email to a registered wallet' })
  async attachContact(@Body() dto: AttachWaitlistContactDto) {
    return this.waitlistService.attachContact(dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get waitlist status for a wallet address' })
  async getStatus(@Query('walletAddress') walletAddress: string) {
    if (!walletAddress) {
      throw new NotFoundException('walletAddress query param required');
    }
    const status = await this.waitlistService.getWalletStatus(walletAddress);
    if (!status) {
      throw new NotFoundException('Wallet not found in waitlist');
    }
    return status;
  }

  @Get('verify-referral')
  @ApiOperation({ summary: 'Verify a referral code is valid' })
  async verifyReferral(@Query() dto: VerifyReferralCodeDto) {
    return this.waitlistService.verifyReferralCode(dto.code);
  }
}

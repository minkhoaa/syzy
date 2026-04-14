import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class RegisterWaitlistDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'direct' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class WaitlistStatsDto {
  @ApiProperty()
  last24h: number;

  @ApiProperty()
  last7d: number;

  @ApiProperty()
  allTime: number;
}

export class WaitlistEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  email: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

// ── Wallet-based DTOs ──

export enum WalletProviderEnum {
  FREIGHTER = 'FREIGHTER',
  ALBEDO = 'ALBEDO',
  XBull = 'XBull',
  OTHER = 'OTHER',
}

export class RequestChallengeDto {
  @ApiProperty({ example: 'GBX...', description: 'Stellar public key (G...)' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

export class ChallengeResponseDto {
  @ApiProperty({ example: 'sign:syzy:wl:1699999999:abc123' })
  challenge: string;

  @ApiProperty()
  nonce: string;

  @ApiProperty()
  expiresAt: string;
}

export class RegisterWalletDto {
  @ApiProperty({ example: 'GBX...' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ enum: WalletProviderEnum })
  @IsEnum(WalletProviderEnum)
  walletProvider: WalletProviderEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signedChallenge: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referredByCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class RegisterWalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  referralCode: string;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  alreadyRegistered: boolean;
}

export class WalletStatusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  referralCode: string;

  @ApiProperty()
  queueRank: number;

  @ApiProperty()
  totalEntries: number;

  @ApiProperty()
  successfulReferralCount: number;

  @ApiPropertyOptional()
  referredByCode: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  hasEmail: boolean;

  @ApiProperty()
  emailDeliveryEligible: boolean;
}

export class AttachWaitlistContactDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address for access code delivery' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'GBX...' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

export class AttachWaitlistContactResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  alreadyHasEmail: boolean;

  @ApiPropertyOptional()
  email: string | null;
}

export class VerifyReferralCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class VerifyReferralCodeResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiPropertyOptional()
  inviterWalletAddress: string | null;
}

export class WaitlistWalletStatsDto {
  @ApiProperty()
  totalWalletEntries: number;

  @ApiProperty()
  last24h: number;

  @ApiProperty()
  last7d: number;

  @ApiProperty()
  totalSuccessfulReferrals: number;

  @ApiPropertyOptional({ type: 'array' })
  topReferrers: Array<{ walletAddress: string; referralCount: number }>;
}

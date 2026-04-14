import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { randomUUID } from 'crypto';
import {
  RegisterWaitlistDto,
  WaitlistStatsDto,
  WaitlistWalletStatsDto,
  ChallengeResponseDto,
  RegisterWalletDto,
  WalletStatusResponseDto,
  VerifyReferralCodeResponseDto,
  AttachWaitlistContactDto,
  AttachWaitlistContactResponseDto,
} from './waitlist.dto';

const CHALLENGE_TTL_SECONDS = 5 * 60;
const CHALLENGE_PREFIX = 'sign:syzy:wl:';

@Injectable()
export class WaitlistService {
  private activeChallenges = new Map<string, { nonce: string; expiresAt: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterWaitlistDto): Promise<{ success: boolean; alreadyRegistered: boolean }> {
    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      return { success: true, alreadyRegistered: true };
    }
    const entry = await this.prisma.waitlistEntry.create({
      data: { email: dto.email, status: 'PENDING', source: dto.source },
    });
    await this.emailService.sendWaitlistConfirmation(dto.email, entry.id, '');
    return { success: true, alreadyRegistered: false };
  }

  async requestChallenge(walletAddress: string): Promise<ChallengeResponseDto> {
    if (!this.isValidSolanaPublicKey(walletAddress)) {
      throw new BadRequestException('Invalid Solana public key format');
    }
    const nonce = randomUUID().replace(/-/g, '');
    const now = Date.now();
    const expiresAt = new Date(now + CHALLENGE_TTL_SECONDS * 1000);
    const challenge = `${CHALLENGE_PREFIX}${Math.floor(now / 1000)}:${nonce}`;
    this.activeChallenges.set(walletAddress, { nonce, expiresAt });
    return { challenge, nonce, expiresAt: expiresAt.toISOString() };
  }

  async verifyChallengeSignature(walletAddress: string, signedChallenge: string): Promise<boolean> {
    const challenge = this.activeChallenges.get(walletAddress);
    if (!challenge) return false;
    if (challenge.expiresAt < new Date()) {
      this.activeChallenges.delete(walletAddress);
      return false;
    }
    const valid = signedChallenge.length > 0;
    if (valid) {
      this.activeChallenges.delete(walletAddress);
    }
    return valid;
  }

  private isValidSolanaPublicKey(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  async attachContact(dto: AttachWaitlistContactDto): Promise<AttachWaitlistContactResponseDto> {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { walletAddress: dto.walletAddress },
    });
    if (!entry) {
      throw new BadRequestException('Wallet not found in waitlist');
    }

    if (entry.email) {
      return { success: true, alreadyHasEmail: true, email: entry.email };
    }

    const normalizedEmail = this.normalizeEmail(dto.email);
    const existingEmailEntry = await this.prisma.waitlistEntry.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmailEntry) {
      throw new ConflictException('This email is already associated with another wallet');
    }

    await this.prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: { email: normalizedEmail },
    });

    await this.emailService.sendWaitlistConfirmation(normalizedEmail, entry.walletAddress ?? '', entry.referralCode ?? '');

    return { success: true, alreadyHasEmail: false, email: normalizedEmail };
  }

  private generateReferralCode(): string {
    return randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  }

  async registerWallet(dto: RegisterWalletDto): Promise<{ id: string; referralCode: string; success: boolean; alreadyRegistered: boolean }> {
    if (!this.isValidSolanaPublicKey(dto.walletAddress)) {
      throw new BadRequestException('Invalid Solana public key format');
    }

    const signatureValid = await this.verifyChallengeSignature(dto.walletAddress, dto.signedChallenge);
    if (!signatureValid) {
      throw new BadRequestException('Invalid or expired challenge signature');
    }

    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { walletAddress: dto.walletAddress },
    });
    if (existing) {
      return { id: existing.id, referralCode: existing.referralCode ?? '', success: true, alreadyRegistered: true };
    }

    let referredById: string | undefined;
    if (dto.referredByCode) {
      const inviter = await this.prisma.waitlistEntry.findUnique({
        where: { referralCode: dto.referredByCode },
      });
      if (inviter && inviter.walletAddress === dto.walletAddress) {
        throw new BadRequestException('Cannot use your own referral code');
      }
      if (inviter) {
        referredById = inviter.id;
      }
    }

    const referralCode = this.generateReferralCode();
    const entry = await this.prisma.waitlistEntry.create({
      data: {
        walletAddress: dto.walletAddress,
        walletProvider: dto.walletProvider,
        referralCode,
        referredById,
        status: 'PENDING',
        source: dto.source,
      },
    });

    if (referredById) {
      await this.prisma.waitlistEntry.update({
        where: { id: referredById },
        data: { successfulReferralCount: { increment: 1 } },
      });
    }

    await this.emailService.sendWaitlistConfirmation(dto.walletAddress, dto.walletAddress, referralCode);

    return { id: entry.id, referralCode, success: true, alreadyRegistered: false };
  }

  async getWalletStatus(walletAddress: string): Promise<WalletStatusResponseDto | null> {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { walletAddress },
    });
    if (!entry) return null;

    const rank = (await this.prisma.waitlistEntry.count({
      where: {
        OR: [
          { successfulReferralCount: { gt: entry.successfulReferralCount } },
          { successfulReferralCount: entry.successfulReferralCount, createdAt: { lt: entry.createdAt } },
        ],
      },
    })) + 1;

    const totalEntries = await this.prisma.waitlistEntry.count({
      where: { walletAddress: { not: null } },
    });

    let referredByCode: string | null = null;
    if (entry.referredById) {
      const inviter = await this.prisma.waitlistEntry.findUnique({
        where: { id: entry.referredById },
        select: { referralCode: true },
      });
      referredByCode = inviter?.referralCode ?? null;
    }

    return {
      id: entry.id,
      walletAddress: entry.walletAddress!,
      referralCode: entry.referralCode ?? '',
      queueRank: rank,
      totalEntries,
      successfulReferralCount: entry.successfulReferralCount,
      referredByCode,
      createdAt: entry.createdAt.toISOString(),
      hasEmail: !!entry.email,
      emailDeliveryEligible: !!entry.email,
    };
  }

  async verifyReferralCode(code: string): Promise<VerifyReferralCodeResponseDto> {
    const inviter = await this.prisma.waitlistEntry.findUnique({
      where: { referralCode: code },
      select: { walletAddress: true },
    });
    return { valid: !!inviter, inviterWalletAddress: inviter?.walletAddress ?? null };
  }

  async getStats(): Promise<WaitlistStatsDto> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [last24hCount, last7dCount, allTimeCount] = await Promise.all([
      this.prisma.waitlistEntry.count({ where: { createdAt: { gte: last24h }, walletAddress: { not: null } } }),
      this.prisma.waitlistEntry.count({ where: { createdAt: { gte: last7d }, walletAddress: { not: null } } }),
      this.prisma.waitlistEntry.count({ where: { walletAddress: { not: null } } }),
    ]);

    return { last24h: last24hCount, last7d: last7dCount, allTime: allTimeCount };
  }

  async getWalletStats(): Promise<WaitlistWalletStatsDto> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [last24hCount, last7dCount, totalWalletEntries, topReferrersResult] = await Promise.all([
      this.prisma.waitlistEntry.count({ where: { createdAt: { gte: last24h }, walletAddress: { not: null } } }),
      this.prisma.waitlistEntry.count({ where: { createdAt: { gte: last7d }, walletAddress: { not: null } } }),
      this.prisma.waitlistEntry.count({ where: { walletAddress: { not: null } } }),
      this.prisma.waitlistEntry.findMany({
        where: { successfulReferralCount: { gt: 0 } },
        orderBy: { successfulReferralCount: 'desc' },
        take: 5,
        select: { walletAddress: true, successfulReferralCount: true },
      }),
    ]);

    return {
      totalWalletEntries,
      last24h: last24hCount,
      last7d: last7dCount,
      totalSuccessfulReferrals: topReferrersResult.reduce((sum, r) => sum + r.successfulReferralCount, 0),
      topReferrers: topReferrersResult.map((r) => ({ walletAddress: r.walletAddress ?? 'unknown', referralCount: r.successfulReferralCount })),
    };
  }
}

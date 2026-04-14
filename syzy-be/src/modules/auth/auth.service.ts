import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomUUID } from 'crypto';

const CHALLENGE_TTL_SECONDS = 5 * 60;
const CHALLENGE_PREFIX = 'sign:syzy:wl:';

@Injectable()
export class AuthService {
  private activeChallenges = new Map<string, { nonce: string; expiresAt: Date }>();

  constructor(private readonly prisma: PrismaService) {}

  async requestChallenge(walletAddress: string): Promise<{ challenge: string; nonce: string; expiresAt: string }> {
    if (!this.isValidWalletAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address format');
    }
    const nonce = randomUUID().replace(/-/g, '');
    const now = Date.now();
    const expiresAt = new Date(now + CHALLENGE_TTL_SECONDS * 1000);
    const challenge = `${CHALLENGE_PREFIX}${Math.floor(now / 1000)}:${nonce}`;
    this.activeChallenges.set(walletAddress, { nonce, expiresAt });
    return { challenge, nonce, expiresAt: expiresAt.toISOString() };
  }

  async verifyChallenge(walletAddress: string, signedChallenge: string): Promise<boolean> {
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

  async register(
    walletAddress: string,
    signedChallenge: string,
    walletProvider: string,
    referredByCode?: string
  ): Promise<{ accessToken: string; refreshToken: string; member: { walletAddress: string; referralCode: string; email: string | null; isContactable: boolean; joinedAt: string } }> {
    const valid = await this.verifyChallenge(walletAddress, signedChallenge);
    if (!valid) {
      throw new BadRequestException('Invalid or expired challenge signature');
    }

    // Check if already registered
    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { walletAddress },
    });

    if (existing) {
      return {
        accessToken: `token-${existing.id}`,
        refreshToken: `refresh-${existing.id}`,
        member: {
          walletAddress: existing.walletAddress!,
          referralCode: existing.referralCode ?? '',
          email: existing.email,
          isContactable: !!existing.email,
          joinedAt: existing.createdAt.toISOString(),
        },
      };
    }

    // Resolve inviter if referral code provided
    let referredById: string | undefined;
    if (referredByCode) {
      const inviter = await this.prisma.waitlistEntry.findUnique({
        where: { referralCode: referredByCode },
      });
      if (inviter && inviter.walletAddress !== walletAddress) {
        referredById = inviter.id;
      }
    }

    // Generate referral code
    const referralCode = randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);

    // Create waitlist entry
    const entry = await this.prisma.waitlistEntry.create({
      data: {
        walletAddress,
        walletProvider,
        referralCode,
        referredById,
        status: 'PENDING',
      },
    });

    // Increment inviter's referral count
    if (referredById) {
      await this.prisma.waitlistEntry.update({
        where: { id: referredById },
        data: { successfulReferralCount: { increment: 1 } },
      });
    }

    return {
      accessToken: `token-${entry.id}`,
      refreshToken: `refresh-${entry.id}`,
      member: {
        walletAddress: entry.walletAddress!,
        referralCode: entry.referralCode!,
        email: entry.email,
        isContactable: !!entry.email,
        joinedAt: entry.createdAt.toISOString(),
      },
    };
  }

  private isValidWalletAddress(address: string): boolean {
    // Solana: Base58, 32-44 chars
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    // Stellar: Base32, starts with G, 56 chars
    const isStellar = /^G[A-Z2-7]{55}$/.test(address);
    return isSolana || isStellar;
  }

  async getMe(walletAddress: string): Promise<{ walletAddress: string; referralCode: string; email: string | null; isContactable: boolean; joinedAt: string } | null> {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { walletAddress },
    });
    if (!entry) return null;
    return {
      walletAddress: entry.walletAddress!,
      referralCode: entry.referralCode ?? '',
      email: entry.email,
      isContactable: !!entry.email,
      joinedAt: entry.createdAt.toISOString(),
    };
  }

  async getMeById(id: string): Promise<{
    id: string;
    walletAddress: string;
    referralCode: string;
    queueRank: number;
    totalEntries: number;
    successfulReferralCount: number;
    referredByCode: string | null;
    createdAt: string;
    hasEmail: boolean;
    emailDeliveryEligible: boolean;
  } | null> {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { id },
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
}

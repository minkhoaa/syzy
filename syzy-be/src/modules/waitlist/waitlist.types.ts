// Shared types for the wallet-based waitlist referral system

export type WalletProvider = 'FREIGHTER' | 'ALBEDO' | 'XBull' | 'OTHER';

export interface WaitlistEntry {
  id: string;
  email: string | null;
  walletAddress: string | null;
  walletProvider: WalletProvider | null;
  referralCode: string | null;
  referredById: string | null;
  successfulReferralCount: number;
  status: 'PENDING' | 'CONFIRMED' | 'ACCESS_SENT' | 'UNSUBSCRIBED' | 'BOUNCED';
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Challenge issued by the backend for wallet ownership proof */
export interface WaitlistChallenge {
  challenge: string;
  nonce: string;
  expiresAt: string;
}

/** Full public status for a registered wallet */
export interface WaitlistWalletStatus {
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
}

/** Referral statistics */
export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
}

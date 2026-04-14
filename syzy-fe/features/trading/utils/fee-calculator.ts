const BPS = 10000;

export interface FeeCalculationParams {
  amount: number;
  platformFeeBps: number;
  lpFeeBps: number;
  discountBps: number;
  stakingFeeShareBps: number;
}

export interface FeeBreakdown {
  platformFee: number;
  lpFee: number;
  totalFee: number;
  netAmount: number;
  rewardShare: number;
  teamShare: number;
  discountBps: number;
  effectiveFeeBps: number;
}

export function calculateSwapFees(params: FeeCalculationParams): FeeBreakdown {
  const { amount, platformFeeBps, lpFeeBps, discountBps, stakingFeeShareBps } = params;

  let platformFee = Math.floor((amount * platformFeeBps) / BPS);
  let lpFee = Math.floor((amount * lpFeeBps) / BPS);

  if (discountBps > 0) {
    const multiplier = BPS - discountBps;
    platformFee = Math.floor((platformFee * multiplier) / BPS);
    lpFee = Math.floor((lpFee * multiplier) / BPS);
  }

  const rewardShare = Math.floor((platformFee * stakingFeeShareBps) / BPS);
  const teamShare = platformFee - rewardShare;
  const totalFee = platformFee + lpFee;
  const netAmount = amount - totalFee;
  const effectiveFeeBps = amount > 0 ? Math.round((totalFee / amount) * BPS) : 0;

  return {
    platformFee,
    lpFee,
    totalFee,
    netAmount,
    rewardShare,
    teamShare,
    discountBps,
    effectiveFeeBps,
  };
}

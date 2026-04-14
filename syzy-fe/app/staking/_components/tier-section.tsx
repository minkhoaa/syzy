import { Check, Lock, Crown, Gem, Shield, Award } from "lucide-react";
import { OYRADE_DECIMALS } from "@/lib/constants/staking";
import { cn } from "@/lib/utils";

const TOKEN_MULTIPLIER = 10 ** OYRADE_DECIMALS;

/**
 * Normalize a tier min value to human-readable token amount.
 * On-chain config may store values as human-readable (1000) or raw (1_000_000_000).
 * If value >= TOKEN_MULTIPLIER it's likely raw → divide. Otherwise use as-is.
 */
function normalizeMin(value: number): number {
  return value >= TOKEN_MULTIPLIER ? value / TOKEN_MULTIPLIER : value;
}

/**
 * Normalize discount to BPS.
 * On-chain config may store as BPS (1000 = 10%) or percentage (10 = 10%).
 * If value <= 100, treat as percentage → multiply by 100 to get BPS.
 */
function normalizeDiscountBps(value: number): number {
  return value > 0 && value <= 100 ? value * 100 : value;
}

// Tier visual config
const TIER_STYLES = [
  {
    name: "Bronze",
    icon: Shield,
    accent: "text-teal-600 dark:text-teal-500",
    accentBg: "bg-teal-500/10",
    accentBorder: "border-teal-500/30",
    badgeBg: "bg-teal-500",
    progressBg: "bg-teal-500",
    glowColor: "shadow-teal-500/20",
  },
  {
    name: "Silver",
    icon: Award,
    accent: "text-slate-500 dark:text-slate-400",
    accentBg: "bg-slate-400/10",
    accentBorder: "border-slate-400/30",
    badgeBg: "bg-slate-500",
    progressBg: "bg-slate-500",
    glowColor: "shadow-slate-500/20",
  },
  {
    name: "Gold",
    icon: Crown,
    accent: "text-yellow-600 dark:text-yellow-500",
    accentBg: "bg-yellow-500/10",
    accentBorder: "border-yellow-500/30",
    badgeBg: "bg-yellow-500",
    progressBg: "bg-yellow-500",
    glowColor: "shadow-yellow-500/20",
  },
  {
    name: "Diamond",
    icon: Gem,
    accent: "text-sky-500 dark:text-sky-400",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-500/30",
    badgeBg: "bg-sky-500",
    progressBg: "bg-sky-500",
    glowColor: "shadow-sky-500/20",
  },
];

// Default tier thresholds in human-readable token amounts
const DEFAULT_TIER_THRESHOLDS = [
  { min: 1_000, discountBps: 1000 },
  { min: 10_000, discountBps: 2000 },
  { min: 50_000, discountBps: 3000 },
  { min: 100_000, discountBps: 4000 },
];

export interface TierConfig {
  bronzeMin: number; bronzeDiscount: number;
  silverMin: number; silverDiscount: number;
  goldMin: number; goldDiscount: number;
  diamondMin: number; diamondDiscount: number;
}

interface TierSectionProps {
  userHolding?: number;
  userStaked: number;
  tierConfig?: TierConfig;
}

function buildTierThresholds(_config?: TierConfig) {
  // Always use hardcoded defaults — on-chain config does not have tiers configured yet.
  // When tiers are configured on-chain via `configure` instruction, re-enable this:
  // if (config && config.bronzeMin > 0 && config.bronzeDiscount > 0) {
  //   return [
  //     { min: normalizeMin(config.bronzeMin), discountBps: normalizeDiscountBps(config.bronzeDiscount) },
  //     ...
  //   ];
  // }
  return DEFAULT_TIER_THRESHOLDS;
}

function getCurrentTier(staked: number, thresholds: typeof DEFAULT_TIER_THRESHOLDS): number {
  let tier = 0;
  if (staked >= thresholds[0].min) tier = 1;
  if (staked >= thresholds[1].min) tier = 2;
  if (staked >= thresholds[2].min) tier = 3;
  if (staked >= thresholds[3].min) tier = 4;
  return tier;
}

const BASE_FEE_BPS = 20; // 0.20%

const TierSection = ({ userStaked, tierConfig }: TierSectionProps) => {
  const thresholds = buildTierThresholds(tierConfig);
  // Convert raw staked amount to human-readable for comparison
  const userStakedHuman = userStaked / TOKEN_MULTIPLIER;
  const currentTier = getCurrentTier(userStakedHuman, thresholds);

  // Build tier data
  const tiers = thresholds.map((t, i) => {
    const tierNum = i + 1;
    const style = TIER_STYLES[i];
    const discountPct = t.discountBps / 100;
    const effectiveFee = ((BASE_FEE_BPS * (10000 - t.discountBps)) / 10000 / 100).toFixed(2);
    const minHuman = t.min; // Already in human-readable format
    const isCurrent = currentTier === tierNum;
    const isUnlocked = currentTier >= tierNum;
    const isLocked = currentTier < tierNum;

    // Progress toward this tier (0-100)
    let progress = 0;
    if (isUnlocked) {
      progress = 100;
    } else if (tierNum === currentTier + 1) {
      // Next tier — show partial progress
      const prevMin = i > 0 ? thresholds[i - 1].min : 0;
      const range = minHuman - prevMin;
      progress = range > 0 ? Math.min(100, Math.max(0, ((userStakedHuman - prevMin) / range) * 100)) : 0;
    }

    return {
      tierNum,
      style,
      discountPct,
      effectiveFee,
      minHuman,
      isCurrent,
      isUnlocked,
      isLocked,
      progress,
    };
  });

  // Next tier info
  const nextTier = currentTier < 4 ? tiers[currentTier] : null;
  const neededForNext = nextTier ? Math.max(0, nextTier.minHuman - userStakedHuman) : 0;

  return (
    <section className="mb-12 md:mb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            Staking Tiers
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Stake more XLM to unlock fee discounts and premium features.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Your Tier</span>
            <div className={cn(
              "text-lg font-bold",
              currentTier > 0 ? TIER_STYLES[currentTier - 1].accent : "text-muted-foreground"
            )}>
              {currentTier > 0 ? TIER_STYLES[currentTier - 1].name : "None"}
            </div>
          </div>
          {currentTier > 0 && (() => {
            const Icon = TIER_STYLES[currentTier - 1].icon;
            return (
              <div className={cn(
                "p-2.5 rounded-xl",
                TIER_STYLES[currentTier - 1].accentBg
              )}>
                <Icon className={cn("w-5 h-5", TIER_STYLES[currentTier - 1].accent)} />
              </div>
            );
          })()}
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const Icon = tier.style.icon;

          return (
            <div
              key={tier.tierNum}
              className={cn(
                "relative rounded-xl border transition-all duration-300 overflow-hidden",
                "bg-white dark:bg-black/40 dark:backdrop-blur-md",
                tier.isCurrent
                  ? cn("border-2", tier.style.accentBorder, "shadow-lg", tier.style.glowColor)
                  : "border-border",
                tier.isLocked ? "opacity-60" : "shadow-sm"
              )}
            >
              {/* Card content */}
              <div className="p-5">
                {/* Tier header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-2 rounded-lg",
                      tier.isUnlocked ? tier.style.accentBg : "bg-slate-50 dark:bg-white/[0.05]"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        tier.isUnlocked ? tier.style.accent : "text-slate-300 dark:text-slate-600"
                      )} />
                    </div>
                    <div>
                      <h3 className={cn(
                        "text-base font-bold",
                        tier.isCurrent ? tier.style.accent : "text-foreground"
                      )}>
                        {tier.style.name}
                      </h3>
                    </div>
                  </div>

                  {tier.isCurrent && (
                    <span className={cn(
                      "px-2 py-0.5 text-white text-[10px] font-bold uppercase rounded-md",
                      tier.style.badgeBg
                    )}>
                      Active
                    </span>
                  )}
                  {tier.isLocked && (
                    <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                {/* Min Stake */}
                <div className="mb-4 px-3 py-2.5 rounded-lg bg-slate-50/80 dark:bg-white/[0.03] border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Min Stake</div>
                  <div className="text-sm font-bold text-foreground font-mono">
                    {tier.minHuman.toLocaleString()} <span className="text-muted-foreground font-sans text-xs">XLM</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2.5">
                  {[
                    { label: "Fee Discount", value: `${tier.discountPct}%` },
                    { label: "Effective Fee", value: `${tier.effectiveFee}%` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center",
                          tier.isUnlocked
                            ? cn(tier.style.accentBg, tier.style.accent)
                            : "bg-slate-100 dark:bg-white/[0.05] text-slate-300 dark:text-slate-600"
                        )}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-muted-foreground font-medium">{item.label}</span>
                      </div>
                      <span className={cn(
                        "font-bold font-mono",
                        tier.isUnlocked ? tier.style.accent : "text-muted-foreground"
                      )}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress bar (only for next tier) */}
                {tier.tierNum === currentTier + 1 && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", tier.style.progressBg)}
                        style={{ width: `${tier.progress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {tier.progress.toFixed(0)}% complete
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Hint */}
      {nextTier && neededForNext > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", nextTier.style.accentBg)}>
              {(() => {
                const NextIcon = nextTier.style.icon;
                return <NextIcon className={cn("w-4 h-4", nextTier.style.accent)} />;
              })()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Stake <span className={cn("font-bold", nextTier.style.accent)}>{neededForNext.toLocaleString()} XLM</span> more to unlock <span className="font-bold">{nextTier.style.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {nextTier.minHuman.toLocaleString()} XLM required
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {userStakedHuman.toLocaleString()} / {nextTier.minHuman.toLocaleString()}
          </div>
        </div>
      )}
    </section>
  );
};

export default TierSection;

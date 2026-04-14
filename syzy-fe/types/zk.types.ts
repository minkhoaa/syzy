export interface ShieldedNote {
  amount: number;
  nullifier: string;
  blinding: string;
  commitment: string;
  index?: number;
  type: "SOL" | "YES" | "NO";
  market?: string;
  poolAddress?: string;
  timestamp?: number;
  isSpent?: boolean;
}

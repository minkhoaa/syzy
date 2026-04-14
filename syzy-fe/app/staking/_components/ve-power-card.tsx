import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VePowerCard = () => {
  return (
    <div className="rounded-xl bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border shadow-sm relative overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 dark:bg-primary/10 blur-3xl rounded-full" />

      <div className="p-8 relative z-10">
        {/* Coming Soon overlay */}
        <div className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl">
          <div className="text-center">
            <Badge variant="outline" className="mb-2 text-xs border-border text-slate-500 dark:text-slate-400">
              Coming Soon
            </Badge>
            <p className="text-sm text-slate-500 dark:text-slate-400">Vote-escrow locking coming soon</p>
          </div>
        </div>

        <div className="opacity-50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              veXLM Power
            </h3>
            <Badge
              variant="outline"
              className="bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border-border text-[10px] font-bold uppercase"
            >
              Inactive
            </Badge>
          </div>

          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">0</div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Voting Power Multiplier
          </p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400 dark:text-slate-500">Lock Period</span>
              <span className="text-slate-900 dark:text-slate-100">—</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-white/[0.05] rounded-full h-2 overflow-hidden">
              <div className="bg-slate-300 dark:bg-white/10 h-2 rounded-full w-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VePowerCard;

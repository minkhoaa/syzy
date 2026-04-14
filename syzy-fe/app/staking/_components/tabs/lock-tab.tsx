"use client"

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LockTab = () => {
  return (
    <div className="flex flex-col h-full justify-between animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <Badge variant="outline" className="mb-4 text-xs border-muted-foreground/30 text-muted-foreground">
          Coming Soon
        </Badge>
        <h2 className="text-2xl font-bold text-foreground mb-2">veXLM Locking</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Lock your XLM tokens for 1-4 years to receive veXLM,
          unlocking governance power and boosted rewards up to 2.5x.
        </p>
      </div>

      <Button
        size="lg"
        disabled
        className="w-full py-5 text-base font-bold rounded-xl mt-3 opacity-50"
      >
        Lock XLM (Coming Soon)
      </Button>
    </div>
  );
};

export default LockTab;

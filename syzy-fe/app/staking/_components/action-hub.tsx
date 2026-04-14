"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StakeTab from "@/app/staking/_components/tabs/stake-tab";
import LockTab from "@/app/staking/_components/tabs/lock-tab";
import ClaimTab from "@/app/staking/_components/tabs/claim-tab";
import UnstakeTab from "@/app/staking/_components/tabs/unstake-tab";
import FundTab from "@/app/staking/_components/tabs/fund-tab";
import { useStaking } from "@/features/staking/hooks/use-staking";

const ActionHub = () => {
  const { isAuthority } = useStaking();

  return (
    <div className="bg-white dark:bg-black rounded-xl border border-border shadow-sm h-full flex flex-col relative overflow-hidden">
      <Tabs defaultValue="stake" className="flex flex-col h-full">
        <TabsList className={`w-full grid ${isAuthority ? "grid-cols-5" : "grid-cols-4"} h-auto p-0 bg-slate-50/50 dark:bg-black rounded-none border-b border-border`}>
          <TabsTrigger
            value="stake"
            className="py-3 sm:py-4 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/[0.03] transition-all"
          >
            Stake
          </TabsTrigger>
          <TabsTrigger
            value="lock"
            className="py-3 sm:py-4 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-border data-[state=active]:text-slate-500 dark:data-[state=active]:text-slate-400 data-[state=active]:bg-slate-100/50 dark:data-[state=active]:bg-white/[0.05] transition-all text-slate-400 dark:text-slate-500"
          >
            <span className="flex items-center gap-1.5">
              Lock
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-slate-400 dark:text-slate-500">
                Soon
              </Badge>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="claim"
            className="py-3 sm:py-4 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/[0.03] transition-all"
          >
            Claim
          </TabsTrigger>
          <TabsTrigger
            value="unstake"
            className="py-3 sm:py-4 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/[0.03] transition-all"
          >
            Unstake
          </TabsTrigger>
          {isAuthority && (
            <TabsTrigger
              value="fund"
              className="py-3 sm:py-4 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:text-teal-500 data-[state=active]:bg-teal-500/[0.03] transition-all"
            >
              Fund
            </TabsTrigger>
          )}
        </TabsList>

        <div className="p-4 sm:p-6 md:p-8 flex-1">
          <TabsContent value="stake" className="h-full mt-0">
            <StakeTab />
          </TabsContent>
          <TabsContent value="lock" className="h-full mt-0">
            <LockTab />
          </TabsContent>
          <TabsContent value="claim" className="h-full mt-0">
            <ClaimTab />
          </TabsContent>
          <TabsContent value="unstake" className="h-full mt-0">
            <UnstakeTab />
          </TabsContent>
          {isAuthority && (
            <TabsContent value="fund" className="h-full mt-0">
              <FundTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default ActionHub;

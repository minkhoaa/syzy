"use client";

import { useState } from "react";
import { Shield, Shuffle, Wallet, TrendingUp, Zap, Key, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay";

function ShieldContent() {
  const [mixingCycles, setMixingCycles] = useState([5]);
  const [delayMinutes, setDelayMinutes] = useState(2);
  const [dynamicPathing, setDynamicPathing] = useState(true);
  const [patternRandomizer, setPatternRandomizer] = useState(false);
  const [liquiditySweep, setLiquiditySweep] = useState(true);
  const [autoMixExpanded, setAutoMixExpanded] = useState(true);
  const [ephemeralExpanded, setEphemeralExpanded] = useState(true);
  const [burnThreshold, setBurnThreshold] = useState("immediate");

  return (
    <div className="flex-1 flex justify-center py-8">
      <div className="w-full max-w-[960px] px-4 sm:px-6 md:px-0">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap gap-2 mb-4 items-center">
          <a className="text-muted-foreground hover:text-foreground text-sm font-medium" href="/dashboard/settings">
            Settings
          </a>
          <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
          <span className="text-foreground text-sm font-medium">Protection & Shield</span>
        </nav>

        {/* Page Heading & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-2">
              Protection & Shield Settings
            </h1>
            <p className="text-muted-foreground text-base">
              Configure your Solana protection layers and ephemeral wallet strategies for secure trading.
            </p>
          </div>
          
          <Card className="w-full sm:min-w-[180px] sm:w-auto bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                  Shield Strength
                </span>
                <div className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
              <div className="flex items-end gap-1">
                <p className="text-3xl font-black leading-none">84%</p>
                <Badge variant="secondary" className="text-green-500 mb-1">+2%</Badge>
              </div>
              <Progress value={84} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestion Banner */}
        <Card className="mb-8 border-primary/40 bg-primary/5 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex gap-4">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold leading-tight">AI Suggestion: Increase mixing cycles</p>
                  <p className="text-muted-foreground text-sm font-normal leading-normal">
                    Optimal settings detected for current market volatility and MEV activity.
                  </p>
                </div>
              </div>
              <Button className="w-full sm:w-auto sm:min-w-[120px] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Quick Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Sections */}
        <div className="space-y-4">
          {/* Auto-Mix Transactions Section */}
          <Card className="overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader 
              className="cursor-pointer border-b hover:bg-muted/50 transition-colors"
              onClick={() => setAutoMixExpanded(!autoMixExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-primary">
                    <Shuffle className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Auto-Mix Transactions</CardTitle>
                    <CardDescription>
                      Obfuscate patterns by routing through intermediate hops.
                    </CardDescription>
                  </div>
                </div>
                {autoMixExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            
            {autoMixExpanded && (
              <CardContent className="p-4 sm:p-6 md:p-8 bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <Label className="flex justify-between">
                      Mixing Cycles
                      <span className="text-primary">x{mixingCycles[0]} Cycles</span>
                    </Label>
                    <Slider
                      value={mixingCycles}
                      onValueChange={setMixingCycles}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                      <span>Standard</span>
                      <span>Max Protection</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label>Delay Between Hops (min)</Label>
                    <Input
                      type="number"
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(Number(e.target.value))}
                      placeholder="Minutes"
                      className="bg-background/40"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">Dynamic Pathing</p>
                          <p className="text-muted-foreground text-xs">Vary mixing routes for each transaction</p>
                        </div>
                        <Switch checked={dynamicPathing} onCheckedChange={setDynamicPathing} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">Pattern Randomizer</p>
                          <p className="text-muted-foreground text-xs">Adds jitter to trade timing</p>
                        </div>
                        <Switch checked={patternRandomizer} onCheckedChange={setPatternRandomizer} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Ephemeral Wallets Section */}
          <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-muted">
            <CardHeader 
              className="cursor-pointer border-b bg-muted/10"
              onClick={() => setEphemeralExpanded(!ephemeralExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Ephemeral Wallets</CardTitle>
                    <CardDescription>
                      Automatically generate single-use wallets for every transaction.
                    </CardDescription>
                  </div>
                </div>
                {ephemeralExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            
            {ephemeralExpanded && (
              <CardContent className="p-4 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="md:col-span-2 space-y-4">
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Auto-Burn Threshold
                        </CardTitle>
                        <span className="text-muted-foreground text-xs">Burn private keys after use</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {["immediate", "24hours", "never"].map((option) => (
                          <Button
                            key={option}
                            variant={burnThreshold === option ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBurnThreshold(option)}
                            className={burnThreshold === option ? "bg-primary/20 border-primary/30 text-primary" : ""}
                          >
                            {option === "immediate" ? "Immediate" : option === "24hours" ? "24 Hours" : "Never"}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">Liquidity Sweep</p>
                          <p className="text-muted-foreground text-xs">Auto-collect dust from inactive wallets</p>
                        </div>
                        <Switch checked={liquiditySweep} onCheckedChange={setLiquiditySweep} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-background/20 border-muted flex flex-col justify-center items-center text-center">
                  <CardContent className="p-6">
                    <Key className="h-8 w-8 text-primary mb-2 mx-auto" />
                    <p className="font-bold text-sm mb-1">Keys Managed</p>
                    <p className="text-primary text-2xl font-black">128</p>
                    <p className="text-muted-foreground text-[10px] mt-2 leading-tight uppercase tracking-widest font-bold">
                      Encrypted in Trusted Execution Environment
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            )}
          </Card>

          {/* Fee Estimator */}
          <Card className="bg-card/50 backdrop-blur-sm mt-12">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                <div className="flex-1 w-full">
                  <CardTitle className="text-lg mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Protection Premium Estimator
                  </CardTitle>
                  <div className="h-24 sm:h-32 w-full bg-background/30 rounded-lg border border-muted relative overflow-hidden flex items-end px-3 sm:px-4 gap-1">
                    {/* Simple Abstract Graph */}
                    {[40, 55, 45, 65, 80, 75, 95].map((height, index) => (
                      <div
                        key={index}
                        className={`bg-primary/${20 + index * 10} w-full rounded-t-sm ${
                          index === 6 ? "bg-primary shadow-[0_0_15px_rgba(255,117,26,0.3)]" : ""
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">
                        Volatility Correlation
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-64 flex flex-col gap-4">
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-4">
                      <p className="text-muted-foreground text-xs font-bold mb-1 uppercase">
                        Estimated Add-on Fee
                      </p>
                      <p className="text-2xl font-black">
                        0.052 <span className="text-sm font-normal text-muted-foreground">SOL</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Button className="w-full py-4 bg-primary hover:bg-primary/90 font-black hover:shadow-[0_0_20px_rgba(255,117,26,0.4)] transition-all flex items-center justify-center gap-2">
                    <Shield className="h-5 w-5" />
                    REFILL SHIELD
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center pb-20">
          <p className="text-muted-foreground text-sm font-medium">
            All settings are locally encrypted. Shield protocol is open-source and community audited.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ShieldPage() {
  return (
    <ComingSoonOverlay
      title="Shield"
      description="Advanced protection settings for discrete trading with ephemeral wallets, transaction mixing, and enhanced security features."
      icon={<Shield className="w-8 h-8" />}
    >
      <ShieldContent />
    </ComingSoonOverlay>
  );
}
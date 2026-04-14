"use client"

import { PredictionHistory } from "@/app/(dashboard)/history/_components/prediction-history"
import { HistoryStats } from "@/app/(dashboard)/history/_components/history-stats"
import { HistoryFilters } from "@/app/(dashboard)/history/_components/history-filters"
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay"
import { History } from "lucide-react"

function HistoryContent() {
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Prediction History</h1>
        <p className="text-muted-foreground mt-2">
          Track your past predictions and performance
        </p>
      </div>
      
      <HistoryStats />
      <HistoryFilters />
      <PredictionHistory />
    </div>
  )
}

export default function HistoryPage() {
  return (
    <ComingSoonOverlay
      title="History"
      description="View your complete prediction history, analyze performance trends, and track your trading journey over time."
      icon={<History className="w-8 h-8" />}
    >
      <HistoryContent />
    </ComingSoonOverlay>
  )
}
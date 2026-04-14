"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Filter, Calendar } from "lucide-react"

export function HistoryFilters() {
  return (
    <Card className="p-3 sm:p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              All Status
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              All Time
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              All Markets
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Badge variant="secondary">23 results</Badge>
          <Button variant="ghost" size="sm">
            <Calendar className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}

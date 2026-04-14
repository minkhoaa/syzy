"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react"
import { motion } from "framer-motion"

const stats = [
  {
    title: "Total Predictions",
    value: "23",
    change: "+3 this week",
    changeType: "positive" as const,
    icon: Target
  },
  {
    title: "Win Rate",
    value: "68.2%",
    change: "+5.1%",
    changeType: "positive" as const,
    icon: TrendingUp
  },
  {
    title: "Total Invested",
    value: "12.4 SOL",
    change: "+2.1 SOL",
    changeType: "positive" as const,
    icon: DollarSign
  },
  {
    title: "Net Profit",
    value: "+3.7 SOL",
    change: "+0.8 SOL",
    changeType: "positive" as const,
    icon: TrendingUp
  }
]

export function HistoryStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className={`text-xs sm:text-sm mt-1 ${
                    stat.changeType === 'positive' 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

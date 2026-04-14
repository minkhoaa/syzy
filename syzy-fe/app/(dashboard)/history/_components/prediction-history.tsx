"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, Shield, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

const mockPredictions = [
  {
    id: "1",
    market: "Will PEPE reach $1M market cap by end of week?",
    side: "yes" as const,
    amount: 0.5,
    odds: 65,
    status: "won" as const,
    payout: 0.77,
    timestamp: "2024-01-28T10:00:00Z",
    isDiscrete: true
  },
  {
    id: "2",
    market: "BONK to hit $2M market cap by Friday?",
    side: "no" as const,
    amount: 1.2,
    odds: 58,
    status: "lost" as const,
    payout: 0,
    timestamp: "2024-01-27T15:30:00Z",
    isDiscrete: false
  },
  {
    id: "3",
    market: "New meme coin to achieve 10x gains?",
    side: "yes" as const,
    amount: 0.3,
    odds: 78,
    status: "pending" as const,
    payout: null,
    timestamp: "2024-01-29T08:15:00Z",
    isDiscrete: true
  }
]

export function PredictionHistory() {
  return (
    <div className="space-y-4">
      {mockPredictions.map((prediction, index) => (
        <motion.div
          key={prediction.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                <div className="flex items-center flex-wrap gap-1.5 sm:space-x-2">
                  <Badge 
                    variant={prediction.status === 'won' ? 'default' : prediction.status === 'lost' ? 'destructive' : 'secondary'}
                  >
                    {prediction.status.toUpperCase()}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={prediction.side === 'yes' ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}
                  >
                    {prediction.side.toUpperCase()}
                  </Badge>
                  {prediction.isDiscrete && <Shield className="w-4 h-4 text-primary" />}
                </div>
                
                <h3 className="font-medium text-foreground">{prediction.market}</h3>
                
                <div className="flex items-center flex-wrap gap-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                  <span>Prediction: {prediction.amount} SOL</span>
                  <span>Odds: {prediction.odds}%</span>
                  {prediction.payout !== null && (
                    <span className={prediction.status === 'won' ? 'text-green-500' : 'text-red-500'}>
                      {prediction.status === 'won' ? `Won: ${prediction.payout} SOL` : 'Lost'}
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(prediction.timestamp).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
              
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

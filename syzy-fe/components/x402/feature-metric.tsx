"use client"

import { motion } from "framer-motion"

interface FeatureMetricProps {
  title: string
  description: string
  icon?: React.ReactNode
  delay?: number
  label?: string
}

export function FeatureMetric({ title, description, icon, delay = 0, label }: FeatureMetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center justify-center p-12 lg:p-16 text-center"
    >
      <div className="mb-2">
        <h4 className="text-5xl md:text-6xl font-bold text-black dark:text-white tracking-tighter">{title}</h4>
      </div>
      <div>
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{description}</p>
      </div>
    </motion.div>
  )
}

"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function LandingFooter() {
  return (
    <div className="relative pt-20 pb-10 bg-neutral-900 dark:bg-black text-white overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-20 px-4 md:px-20">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-4 sm:mb-6 text-white">
              Ready to see the <span className="text-neutral-500">invisible?</span>
            </h1>
            <p className="text-base sm:text-xl text-neutral-400 max-w-md mb-6 sm:mb-8">
              Join the first prediction market built for total discretion. No noise. Just signal.
            </p>

            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-white font-medium hover:bg-teal-600 transition-colors"
            >
              Join Waitlist
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 md:pl-20">
            <div>
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-6">Platform</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/markets" className="text-lg text-neutral-300 hover:text-primary transition-colors">
                    Markets
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-lg text-neutral-300 hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/staking" className="text-lg text-neutral-300 hover:text-primary transition-colors">
                    Staking
                  </Link>
                </li>
                <li className="flex items-center gap-2 text-lg text-neutral-500 cursor-not-allowed">
                  Leaderboard <span className="text-xs bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded ml-1">SOON</span>
                </li>
                <li>
                  <Link href="/agent" className="text-lg text-neutral-300 hover:text-primary transition-colors">
                    Agent
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-6">Resources</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/blog" className="text-lg text-neutral-300 hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/x402" className="text-lg text-neutral-300 hover:text-primary transition-colors">
                    x402
                  </Link>
                </li>
                <li>
                  <Link href="https://docs.oyrade.com" target="_blank" className="text-lg text-neutral-300 hover:text-primary transition-colors">
                    Docs
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 md:px-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-neutral-500">All systems operational</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="https://x.com/OyradeXHQ" target="_blank" className="text-neutral-500 hover:text-primary transition-colors text-sm">
              Twitter
            </Link>
            <Link href="https://discord.gg/fB6zG5Ck5q" target="_blank" className="text-neutral-500 hover:text-primary transition-colors text-sm">
              Discord
            </Link>
            <Link href="https://t.me/OyradeHQ" target="_blank" className="text-neutral-500 hover:text-primary transition-colors text-sm">
              Telegram
            </Link>
            <span className="text-neutral-600 text-sm">© 2025 Syzy</span>
          </div>
        </div>
      </div>
    </div>
  )
}

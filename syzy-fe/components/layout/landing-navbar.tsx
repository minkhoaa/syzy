"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { WalletButton } from "@/components/shared/wallet/wallet-button"
import { ChevronDown } from "lucide-react"

export function LandingNavbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const exploreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isStaking = pathname === "/staking"
  const isBlog = pathname.startsWith("/blog")
  const isX402 = pathname.startsWith("/x402")
  const isWaitlist = pathname === "/waitlist"

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50)
  })

  const navLinkClass = "text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-teal-500 transition-colors"

  const handleExploreEnter = () => {
    if (exploreTimeout.current) clearTimeout(exploreTimeout.current)
    setExploreOpen(true)
  }

  const handleExploreLeave = () => {
    exploreTimeout.current = setTimeout(() => setExploreOpen(false), 150)
  }

  const exploreItems = [
    { label: "Features", href: isBlog || isStaking ? "/#features" : "#features" },
    { label: "How it Works", href: isBlog || isStaking ? "/#how-it-works" : "#how-it-works" },
    { label: "Community", href: isBlog || isStaking ? "/#socials" : "#socials" },
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/80 dark:bg-background/80 backdrop-blur-lg border-b border-border/50 py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo/syzy.svg"
            alt="Syzy"
            width={140}
            height={44}
            className="h-11 w-auto object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <div
            className="relative"
            onMouseEnter={handleExploreEnter}
            onMouseLeave={handleExploreLeave}
          >
            <button
              className={cn(navLinkClass, "flex items-center gap-1")}
              onClick={() => setExploreOpen((v) => !v)}
            >
              Explore
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", exploreOpen && "rotate-180")} />
            </button>
            {exploreOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
                <div className="bg-white dark:bg-zinc-900 border border-border/60 rounded-lg shadow-lg py-1.5 min-w-[160px]">
                  {exploreItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-500 transition-colors"
                      onClick={() => setExploreOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link
            href="/blog"
            className={cn(navLinkClass, isBlog && "text-primary font-semibold")}
          >
            Blog
          </Link>
          <Link
            href="https://docs.oyrade.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={navLinkClass}
          >
            Docs
          </Link>
          <Link
            href="/staking"
            className={cn(navLinkClass, isStaking && "text-primary font-semibold")}
          >
            Staking
          </Link>
          <Link
            href="/waitlist"
            className={cn(navLinkClass, isWaitlist && "text-primary font-semibold")}
          >
            Waitlist
          </Link>
          <Link
            href="/x402"
            className={cn(navLinkClass, isX402 && "text-primary font-semibold")}
          >
            x402
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isStaking && <WalletButton />}
          <Button onClick={() => router.push("/dashboard")} size="default" className="sm:text-base text-sm">
            Launch App
          </Button>
        </div>
      </div>
    </motion.header>
  )
}

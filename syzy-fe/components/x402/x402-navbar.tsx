"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "HOME", href: "/x402", exact: true },
  { label: "DOCS", href: "/x402/docs", exact: false },
  { label: "EXAMPLES", href: "/x402/examples", exact: false },
  { label: "SDK", href: "/x402/sdk", exact: false },
  { label: "AGENTS", href: "/x402/agents", exact: false },
]

export function X402Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50)
  })

  const navLinkClass =
    "text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-teal-500 transition-colors"

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 dark:bg-background/80 backdrop-blur-lg border-b border-border/50 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/x402" className="flex items-center space-x-3">
          <Image
            src="/logo/syzy.svg"
            alt="Syzy"
            width={80}
            height={80}
            className="h-7 w-auto"
          />
          <span className="text-xl font-bold text-foreground tracking-tight">
            X402 API
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                navLinkClass,
                isActive(link.href, link.exact) && "text-primary font-semibold"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button asChild size="default" className="hidden sm:inline-flex">
            <Link href="/dashboard">Launch App</Link>
          </Button>
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white/95 dark:bg-background/95 backdrop-blur-lg border-b border-border/50"
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  navLinkClass,
                  isActive(link.href, link.exact) && "text-primary font-semibold"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Button asChild size="default" className="w-full sm:hidden">
              <Link href="/dashboard">Launch App</Link>
            </Button>
          </nav>
        </motion.div>
      )}
    </motion.header>
  )
}

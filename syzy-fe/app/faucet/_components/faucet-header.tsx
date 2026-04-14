"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WalletButton } from "@/components/shared/wallet/wallet-button";
import { Button } from "@/components/ui/button";

export function FaucetNavbar() {
  const router = useRouter();

  const navLinkClass =
    "text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-teal-500 transition-colors";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-lg border-b border-border/50 py-3"
    >
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/logo/syzy.svg"
            alt="Syzy"
            width={80}
            height={80}
            className="h-7 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/#features" className={navLinkClass}>
            Features
          </Link>
          <Link href="/#how-it-works" className={navLinkClass}>
            How it Works
          </Link>
          <Link href="/#socials" className={navLinkClass}>
            Community
          </Link>
          <Link href="/blog" className={navLinkClass}>
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
          <Link href="/staking" className={navLinkClass}>
            Staking
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <WalletButton />
          <Button
            onClick={() => router.push("/dashboard")}
            size="default"
            className="sm:text-base text-sm"
          >
            Launch App
          </Button>
        </div>
      </div>
    </motion.header>
  );
}

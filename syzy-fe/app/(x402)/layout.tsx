import { X402Navbar } from "@/components/x402/x402-navbar"
import { X402Footer } from "@/components/x402/x402-footer"

export default function X402Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="antialiased bg-white dark:bg-black text-black dark:text-white min-h-screen selection:bg-emerald-500/30 dark:selection:bg-emerald-500/30">
      <X402Navbar />
      <main className="pt-20 min-h-screen">{children}</main>
      <X402Footer />
    </div>
  )
}

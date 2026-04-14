import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ReownProvider } from "@/providers/solana-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AutoLogin } from "@/components/auth/auto-login";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAnalyticsProvider } from "@/providers/google-analytics-provider";
import { VercelAnalyticsProvider } from "@/providers/vercel-analytics-provider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Syzy - Decentralized Prediction Platform",
  description: "Smart Predictions, Upgraded Wins. Decentralized prediction platform designed for discretion on Pump.fun tokens with Solana.",
  keywords: ["prediction markets", "solana", "decentralized", "predictions", "pump.fun", "defi"],
  authors: [{ name: "Syzy Team" }],
  openGraph: {
    title: "Syzy - Decentralized Prediction Platform",
    description: "Smart Predictions, Upgraded Wins. Decentralized prediction platform designed for discretion.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* snarkjs loaded globally to avoid Turbopack bundling crash — accessed as window.snarkjs in lib/zk/ */}
        <Script
          src="https://cdn.jsdelivr.net/npm/snarkjs@0.7.5/build/snarkjs.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <ReownProvider
            >
              <AutoLogin />
              <TooltipProvider delayDuration={0}>
                {children}
              </TooltipProvider>
              <Toaster position="bottom-right" />
            </ReownProvider>
          </QueryProvider>
        </ThemeProvider>
        <GoogleAnalyticsProvider />
        <VercelAnalyticsProvider />
      </body>
    </html>
  );
}

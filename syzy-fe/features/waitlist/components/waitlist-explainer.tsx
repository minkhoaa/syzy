"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "How does the queue ranking work?",
    answer:
      "Your queue score is calculated from your referral count and recency of your signup. Every successful referral adds significant points, pushing you higher in the queue. Earlier joiners also get a small time bonus.",
  },
  {
    question: "What counts as a successful referral?",
    answer:
      "A referral is successful when someone joins the waitlist using your link and connects a wallet. The referral only counts once they complete the registration process.",
  },
  {
    question: "When will I get access?",
    answer:
      "Access is rolled out in queue order. Higher-ranked members get priority. We&apos;ll email you when your spot opens (if you provided an email), or you can check your rank anytime on this page.",
  },
  {
    question: "Do I need a specific wallet?",
    answer:
      "Any Solana-compatible wallet works — Phantom, Solflare, Backpack, Leap, or others. We use the standard Solana message signing flow.",
  },
  {
    question: "Is my email required?",
    answer:
      "No. Email is completely optional. You can join and track your rank with just your wallet. Email is only used if you want us to reach out when your access is ready.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <span className={cn(
          "text-muted-foreground text-xs transition-transform duration-200 select-none",
          open && "rotate-180 inline-block",
        )}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export function WaitlistExplainer() {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Frequently asked
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-0">
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
}

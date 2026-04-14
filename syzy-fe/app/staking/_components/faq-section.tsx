"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    category: "Staking & Rewards",
    questions: [
      {
        q: "How does Syzy staking work?",
        a: "Stake your XLM tokens into the reward pool to earn XLM rewards from platform trading fees. Rewards accrue continuously every second based on your share of the total staked amount. There are no lockup periods — you can unstake at any time."
      },
      {
        q: "Where do staking rewards come from?",
        a: "Rewards come from XLM deposited into the reward pool from platform trading fees. The pool distributes rewards at a fixed rate per second to all stakers proportionally. When unstaking, any pending XLM rewards are automatically claimed."
      },
      {
        q: "How is the reward rate determined?",
        a: "The reward rate is set when the pool is funded. It distributes a fixed amount of XLM evenly over the reward period (e.g., 7 days). Your share of rewards is proportional to your staked balance relative to the total pool."
      }
    ]
  },
  {
    category: "Staking Mechanics",
    questions: [
      {
        q: "Is there a minimum stake amount?",
        a: "The minimum stake is 1 XLM token (0.000001 with decimals). There is no maximum limit."
      },
      {
        q: "Are there any fees for staking or unstaking?",
        a: "There are no protocol fees for staking, unstaking, or claiming rewards. You only pay standard Stellar network transaction fees (typically < 0.001 XLM)."
      },
      {
        q: "What happens when I unstake?",
        a: "When you unstake, your XLM tokens are returned to your wallet immediately. Any pending XLM rewards are also automatically claimed in the same transaction."
      }
    ]
  },
  {
    category: "veXLM & Locking",
    questions: [
      {
        q: "What is veXLM?",
        a: "veXLM (vote-escrowed XLM) is a planned feature that will allow you to lock XLM tokens for 1-4 years to receive boosted rewards (up to 2.5x multiplier) and governance voting power. This feature is coming soon."
      }
    ]
  },
  {
    category: "Tier System",
    questions: [
      {
        q: "What are the different tiers?",
        a: "Tier 1 (Holder): Basic trading fee discounts. Tier 2 (Staker): Enhanced discounts and AI signal access. Tier 3 (Locked): Governance rights and higher AI accuracy (requires veXLM, coming soon). Tier 4 (Whale): Full revenue share and custom features (requires veXLM, coming soon)."
      },
      {
        q: "How do I move up tiers?",
        a: "Tiers are determined by your staked XLM amount and (when available) your veXLM lock duration. Staking more XLM moves you to higher tiers with better benefits."
      }
    ]
  },
  {
    category: "Security",
    questions: [
      {
        q: "Is the staking contract secure?",
        a: "The reward pool contract is deployed on Stellar and uses proper authority checks. It includes an emergency pause mechanism that the pool authority can activate if needed. The contract follows the standard Synthetix reward distribution model."
      }
    ]
  }
];

const FaqSection = () => {
  return (
    <section className="py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Frequently Asked{" "}
          <span className="text-primary">Questions</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Everything you need to know about Syzy staking and rewards.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {faqData.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
              {section.category}
            </h3>
            <Accordion type="single" collapsible className="space-y-3">
              {section.questions.map((item, itemIndex) => (
                <AccordionItem
                  key={itemIndex}
                  value={`${sectionIndex}-${itemIndex}`}
                  className="bg-white dark:bg-black/40 dark:backdrop-blur-md border border-border rounded-xl overflow-hidden data-[state=open]:border-l-4 data-[state=open]:border-l-primary transition-all shadow-sm"
                >
                  <AccordionTrigger className="text-left text-slate-900 dark:text-slate-100 hover:text-primary hover:no-underline px-4 sm:px-6 py-4 font-bold text-sm sm:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-500 dark:text-slate-400 px-4 sm:px-6 pb-6 border-t border-border pt-4 text-sm sm:text-base font-medium leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;

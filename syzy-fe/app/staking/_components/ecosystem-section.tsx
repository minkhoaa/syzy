import { Repeat, Brain, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const EcosystemSection = () => {
  const benefits: Benefit[] = [
    {
      icon: <Repeat className="w-8 h-8" />,
      title: "Revenue Share",
      description:
        "Earn XLM rewards from platform trading fees distributed continuously to stakers.",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Edge",
      description:
        "Access institutional-grade predictive models and sentiment analysis 5 seconds before public release.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8" />,
      title: "zk-Shield",
      description:
        "Optional privacy layer for large stakers to obscure position size and history from on-chain surveillance.",
    },
  ];

  return (
    <section className="mb-12 md:mb-20">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          Ecosystem Benefits
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
          Core pillars of value accrual for the Syzy protocol.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {benefits.map((benefit, index) => (
          <div
            key={benefit.title}
            className="bg-white dark:bg-black/40 dark:backdrop-blur-md rounded-xl border border-border p-5 sm:p-8 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/[0.05] flex items-center justify-center mb-6 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors duration-300">
              {benefit.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              {benefit.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 font-medium">
              {benefit.description}
            </p>
            <div className="h-1 w-12 bg-primary/20 group-hover:bg-primary transition-colors duration-300 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default EcosystemSection;

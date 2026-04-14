import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics Coming Soon</h1>
        <p className="text-slate-500 mb-8">
          We're building detailed portfolio analytics including PnL tracking, performance charts, and market insights. Stay tuned!
        </p>
        <Link href="/portfolio">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
        </Link>
      </div>
    </div>
  );
}

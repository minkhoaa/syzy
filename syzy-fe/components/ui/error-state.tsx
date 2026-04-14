import { AlertCircle, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({ message, icon: Icon, action, className }: ErrorStateProps) {
  const DisplayIcon = Icon || AlertCircle;

  return (
    <div className={cn(
      "rounded-xl border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10 p-6 text-center animate-fade-scale-in",
      className
    )}>
      {/* Animated icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/30 flex items-center justify-center animate-shake">
        <DisplayIcon className="w-8 h-8 text-destructive" />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-2">
        Oops! Something went wrong
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        {message}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

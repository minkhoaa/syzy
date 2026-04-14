import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "strong";
}

export function GlassCard({
  children,
  className,
  intensity = "medium"
}: GlassCardProps) {
  const intensityClasses = {
    light: "glass-light",
    medium: "glass-medium",
    strong: "glass-strong"
  };

  return (
    <div className={cn(
      "rounded-xl",
      intensityClasses[intensity],
      className
    )}>
      {children}
    </div>
  );
}

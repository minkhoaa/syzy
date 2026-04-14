"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface ComingSoonOverlayProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ComingSoonOverlay({
  title,
  description,
  icon,
  children,
  className
}: ComingSoonOverlayProps) {
  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* Blurred background content */}
      <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/5 backdrop-blur-sm" />
      
      {/* Centered content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <Card className="p-8 flex flex-col items-center text-center max-w-md w-full bg-card/90 backdrop-blur-sm border-border/50">
          {icon && (
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                {icon}
              </div>
            </div>
          )}
          
          <Typography variant="h2" weight="bold" className="mb-2 text-center">
            {title}
          </Typography>
          
          <Badge className="mb-4">Coming Soon</Badge>
          
          {description && (
            <Typography variant="p" className="mb-6 text-left">
              {description}
            </Typography>
          )}
          
          <Typography variant="small" className="text-left">
            This feature is currently under development and will be available soon.
          </Typography>
        </Card>
      </div>
    </div>
  );
}
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const notifyHeaderVariants = cva("z-50 w-full fcenter overflow-hidden transition-all duration-300", {
  variants: {
    variant: {
      default: "bg-primary/85 text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-500 text-white",
      mock: "bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white shadow-lg border-b border-blue-500/20",
    },
    size: {
      default: "h-[var(--notify-height)]",
      sm: "h-[calc(var(--notify-height)-5px)]",
      lg: "h-[calc(var(--notify-height)+10px)]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface NotifyHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notifyHeaderVariants> {
  message?: string | React.ReactNode;
  time?: number;
  scrollThreshold?: number;
  showCloseButton?: boolean;
  onClose?: () => void;
  scrollBehavior?: "hide" | "show" | "sticky";
}

/**
 * NotifyHeader component
 * example:
 * Default (now uses primary color)
 *   <NotifyHeader
 *     message="This is a primary notification"
 *     scrollBehavior="show"
 *   />
 * Secondary
 *   <NotifyHeader
 *     variant="secondary"
 *     message="This is a secondary notification"
 *     scrollBehavior="show"
 *   />
 * Destructive
 *   <NotifyHeader
 *     variant="destructive"
 *     message="This is a destructive notification"
 *     scrollBehavior="show"
 *   />
 *
 * Different sizes (now smaller)
 *   <NotifyHeader
 *     size="sm"
 *     message="Small notification (32px)"
 *     scrollBehavior="show"
 *   />
 *   <NotifyHeader
 *     size="lg"
 *     message="Large notification (48px)"
 *     scrollBehavior="show"
 * />
 * Without close button
 *   <NotifyHeader
 *     message="Notification without close button"
 *     showCloseButton={false}
 *     scrollBehavior="show"
 *   />
 *
 */
const NotifyHeader = React.forwardRef<HTMLDivElement, NotifyHeaderProps>(
  (
    {
      className,
      variant,
      size = "default",
      message,
      time,
      scrollThreshold = 10,
      showCloseButton = true,
      onClose,
      scrollBehavior = "hide",
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isClosing, setIsClosing] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [scrollY, setScrollY] = React.useState(0);

    React.useEffect(() => {
      const handleScroll = () => {
        setScrollY(window.scrollY);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    React.useEffect(() => {
      if (!time) {
        // Small delay for smooth appear animation
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setIsVisible(true), time);
        return () => clearTimeout(timer);
      }
    }, [time]);

    React.useEffect(() => {
      if (scrollBehavior === "hide") {
        setIsScrolled(scrollY > scrollThreshold);
      } else if (scrollBehavior === "show") {
        setIsScrolled(false);
      }
    }, [scrollY, scrollThreshold, scrollBehavior]);

    const handleClose = () => {
      setIsClosing(true);
      // Delay for close animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        onClose?.();
      }, 300);
      return () => clearTimeout(timer);
    };

    if (!message) return null;
    if (!isVisible && !isClosing) return null;

    return (
      <div
        ref={ref}
        className={cn(
          notifyHeaderVariants({ variant, size }),
          // Animation classes
          isVisible && !isClosing && "animate-slide-down",
          isClosing && "animate-slide-up",
          // Scroll behavior
          isScrolled && scrollBehavior === "hide" ? "h-0 overflow-hidden" : "",
          // Base transition
          "transition-all duration-300 ease-out",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex justify-center items-center w-full relative",
            size === "default" && "h-(--notify-height)",
            size === "sm" && "h-[calc(var(--notify-height)-5px)]",
            size === "lg" && "h-[calc(var(--notify-height)+10px)]",
            // Scroll animation
            isScrolled && scrollBehavior === "hide" 
              ? "-translate-y-full opacity-0" 
              : "translate-y-0 opacity-100",
            "transition-all duration-300 ease-out"
          )}
        >
          {typeof message === "string" ? (
            <Typography 
              className={cn(
                "text-center font-medium text-xs px-4",
                // Animation cho text
                isVisible && !isClosing && "animate-fade-in"
              )}
            >
              {message}
            </Typography>
          ) : (
            <div 
              className={cn(
                "flex-1 h-full text-center text-sm px-4",
                isVisible && !isClosing && "animate-fade-in"
              )}
            >
              {message}
            </div>
          )}
          
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6",
                "text-primary-foreground/60 hover:text-primary-foreground",
                "hover:bg-primary-foreground/15 hover:scale-110 active:scale-95",
                "transition-all duration-200 ease-out rounded-full",
                "focus:outline-none focus:ring-2 focus:ring-primary-foreground/30",
                // Animation cho close button
                isVisible && !isClosing && "animate-scale-in",
                isClosing && "scale-90 opacity-50"
              )}
              onClick={handleClose}
            >
              <X 
                size={12} 
                className={cn(
                  "transition-transform duration-200 text-black/80",
                  isClosing && "rotate-90"
                )} 
              />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

NotifyHeader.displayName = "NotifyHeader";


export { NotifyHeader, notifyHeaderVariants };

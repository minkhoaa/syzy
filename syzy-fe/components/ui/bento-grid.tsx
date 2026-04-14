import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[23rem] grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 rounded-xl group/bento hover:translate-y-[-2px] transition duration-200 shadow-[0px_6px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[0px_6px_0px_0px_rgba(255,117,24,0.1)] flex flex-col overflow-hidden",
                className
            )}
        >
            {/* Header / Visual: Fixed Height for perfect alignment */}
            <div className="w-full h-[14rem] shrink-0 border-b border-neutral-100/50 dark:border-neutral-800/50">
                {header}
            </div>

            {/* Content: Fills remaining space */}
            <div className="transition duration-200 p-6 flex flex-col h-full relative z-10">
                <div className="mb-2">
                    {icon}
                </div>
                <div className="font-bold text-foreground mb-2 text-lg">
                    {title}
                </div>
                <div className="font-normal text-muted-foreground text-sm leading-relaxed whitespace-normal h-full">
                    {description}
                </div>
            </div>
        </div>
    );
};

"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";

function AnchorLinkHandler() {
    const lenis = useLenis();

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor && anchor.hash && anchor.hash.startsWith('#') && anchor.origin === window.location.origin) {
                e.preventDefault();
                lenis?.scrollTo(anchor.hash);
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [lenis]);

    return null;
}

export function SmoothScrollProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
            <AnchorLinkHandler />
            {children}
        </ReactLenis>
    );
}

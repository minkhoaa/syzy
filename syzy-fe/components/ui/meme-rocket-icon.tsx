import React from "react";

export const MemeRocketIcon = ({ className }: { className?: string }) => (
    <div className={className}>
        <img
            src="/images/meme-coins-v3.png"
            alt="Meme coins"
            className="w-full h-auto"
            style={{ clipPath: "inset(0 0 3% 0)" }}
        />
    </div>
);

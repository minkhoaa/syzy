export function AgentNetworkIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="4" r="2" fill="currentColor" />
            <circle cx="4" cy="8" r="2" fill="currentColor" fillOpacity="0.5" />
            <circle cx="20" cy="8" r="2" fill="currentColor" fillOpacity="0.5" />
            <circle cx="12" cy="20" r="2" fill="currentColor" />
        </svg>
    )
}

export function PredictionChartIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M3 3V21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16L11 11L15 13L21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="16" r="1.5" fill="currentColor" />
            <circle cx="11" cy="11" r="1.5" fill="currentColor" fillOpacity="0.5" />
            <circle cx="15" cy="13" r="1.5" fill="currentColor" fillOpacity="0.5" />
            <circle cx="21" cy="6" r="1.5" fill="currentColor" />
        </svg>
    )
}

export function LiquidityPoolIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 6V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="12" cy="15" r="1.5" fill="currentColor" />
            <circle cx="12" cy="21" r="1.5" fill="currentColor" fillOpacity="0.5" />
        </svg>
    )
}

export function OracleLightningIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        </svg>
    )
}

export function PrivacyHexIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
    )
}

export function ZkEyeIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 4L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

export function TargetCrosshairIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 17V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 12H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
    )
}

export function CheckCircleNeonIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M22 11.08V12C21.9988 14.1564 21.3001 16.2547 20.0093 17.9818C18.7185 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5574 22.1219 8.53447 21.3746C6.51154 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="22" cy="4" r="1" fill="currentColor" />
        </svg>
    )
}

"use client"
import { cn } from "@/lib/utils"
import React, {
    useRef,
    useState,
    MouseEvent,
    useContext,
    createContext,
    useEffect,
} from "react"

interface SpotlightProps {
    children: React.ReactNode
    className?: string
    ProximitySpotlight?: boolean
    HoverFocusSpotlight?: boolean
    CursorFlowGradient?: boolean
}
interface SpotlightItemProps {
    children: React.ReactNode
    className?: string
}

interface SpotLightContextType {
    ProximitySpotlight: boolean
    HoverFocusSpotlight: boolean
    CursorFlowGradient: boolean
}

const SpotLightContext = createContext<SpotLightContextType | undefined>(
    undefined
)
export const useSpotlight = () => {
    const context = useContext(SpotLightContext)
    if (!context) {
        throw new Error("useSpotlight must be used within a SpotlightProvider")
    }
    return context
}
export const Spotlight = ({
    children,
    className,
    ProximitySpotlight = true,
    HoverFocusSpotlight = false,
    CursorFlowGradient = true,
}: SpotlightProps) => {
    return (
        <SpotLightContext.Provider
            value={{
                ProximitySpotlight,
                HoverFocusSpotlight,
                CursorFlowGradient,
            }}
        >
            <div className={cn("group relative z-10 rounded-md", className)}>
                {children}
            </div>
        </SpotLightContext.Provider>
    )
}

export function SpotLightItem({ children, className }: SpotlightItemProps) {
    const { HoverFocusSpotlight, ProximitySpotlight, CursorFlowGradient } =
        useSpotlight()
    const boxWrapper = useRef(null)
    const [isHovered, setIsHovered] = useState(false)
    const [mousePosition, setMousePosition] = useState<{ x: number | null; y: number | null }>({
        x: null,
        y: null,
    })

    useEffect(() => {
        const updateMousePosition = (ev: MouseEvent) => {
            setMousePosition({ x: ev.clientX, y: ev.clientY })
        }
        // @ts-ignore
        window.addEventListener("mousemove", updateMousePosition)
        return () => {
            // @ts-ignore
            window.removeEventListener("mousemove", updateMousePosition)
        }
    }, [])

    const [overlayColor, setOverlayColor] = useState({ x: 0, y: 0 })
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const { currentTarget, clientX, clientY } = e
        let { left, top } = currentTarget.getBoundingClientRect()

        const x = clientX - left
        const y = clientY - top

        setOverlayColor({ x, y })
    }

    return (
        <div
            onMouseMove={handleMouseMove}
            onMouseEnter={() => CursorFlowGradient && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            ref={boxWrapper}
            className={cn(
                className,
                "relative rounded-lg p-[2px] bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
            )}
        >
            {isHovered && (
                <div
                    className="pointer-events-none absolute opacity-0 z-50 rounded-xl w-full h-full group-hover:opacity-100 transition duration-300"
                    style={{
                        background: `
            radial-gradient(
              250px circle at ${overlayColor.x}px ${overlayColor.y}px,
              rgba(255, 255, 255, 0.137),
              transparent 80%
            )
          `,
                    }}
                />
            )}
            {HoverFocusSpotlight && (
                <div
                    className="absolute opacity-0 group-hover:opacity-100 z-10 inset-0 bg-fixed rounded-lg"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, #ffffff76 0%,transparent 20%,transparent) fixed`,
                    }}
                ></div>
            )}
            {ProximitySpotlight && (
                <div
                    className="absolute inset-0 z-0 bg-fixed rounded-lg"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, #ffffff6e 0%,transparent 20%,transparent) fixed`,
                    }}
                ></div>
            )}
            <div className="relative z-20 h-full w-full">{children}</div>
        </div>
    )
}

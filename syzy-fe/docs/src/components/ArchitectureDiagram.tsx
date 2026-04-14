import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

// Theme palettes
const themes = {
    dark: {
        bg: '#0a0b10',
        border: 'rgba(255,255,255,0.06)',
        cardFill: '#13151c',
        cardStroke: 'rgba(255,255,255,0.07)',
        text: '#e2e8f0',
        subText: '#64748b',
        line: '#334155',
        label: '#475569',
        labelBg: '#0a0b10',
        gridDot: 'rgba(255,255,255,0.04)',
        shadowOpacity: 0.4,
    },
    light: {
        bg: '#f8fafc',
        border: '#e2e8f0',
        cardFill: '#ffffff',
        cardStroke: '#e2e8f0',
        text: '#1e293b',
        subText: '#94a3b8',
        line: '#cbd5e1',
        label: '#94a3b8',
        labelBg: '#f8fafc',
        gridDot: 'rgba(0,0,0,0.04)',
        shadowOpacity: 0.08,
    },
};

// Node data for each layer
const layers = [
    {
        label: 'FRONTEND',
        nodes: [
            { label: 'Next.js App', sub: 'User Interface', color: '#2dd4bf' },
        ],
    },
    {
        label: 'BLOCKCHAIN & API',
        nodes: [
            { label: 'Helius RPC', sub: 'Indexing & Data', color: '#3b82f6' },
            { label: 'Anchor Program', sub: 'Smart Contract', color: '#8b5cf6' },
            { label: 'Webhooks', sub: 'Event Streaming', color: '#3b82f6' },
        ],
    },
    {
        label: 'INFRASTRUCTURE',
        nodes: [
            { label: 'SPL Tokens', sub: 'Outcome Shares', color: '#22c55e' },
            { label: 'Switchboard V3', sub: 'Price Feeds', color: '#14b8a6' },
            { label: 'UMA Oracle', sub: 'Event Resolution', color: '#14b8a6' },
            { label: 'Solnado Mixer', sub: 'Privacy Pool', color: '#6366f1' },
        ],
    },
];

// Layout constants
const SVG_W = 840;
const SVG_H = 380;
const CARD_H = 56;
const CARD_R = 10;
const DOT_R = 6;
const GLOW_R = 16;

// Card positions per row
const row1 = [{ x: 335, w: 170 }];
const row2 = [{ x: 98, w: 170 }, { x: 335, w: 170 }, { x: 572, w: 170 }];
const row3 = [{ x: 50, w: 160 }, { x: 240, w: 160 }, { x: 430, w: 160 }, { x: 620, w: 160 }];
const rows = [row1, row2, row3];

// Y positions: label, card top
const layerY = [
    { labelY: 22, cardY: 38 },
    { labelY: 136, cardY: 152 },
    { labelY: 252, cardY: 268 },
];

// Helpers
function nodeCx(row: number, col: number) {
    return rows[row][col].x + rows[row][col].w / 2;
}
function cardBot(row: number) {
    return layerY[row].cardY + CARD_H;
}
function cardTopY(row: number) {
    return layerY[row].cardY;
}

// Connection definitions: [sourceRow, sourceCol, targetRow, targetCol, label]
const connections: [number, number, number, number, string][] = [
    [0, 0, 1, 0, 'reads'],
    [0, 0, 1, 1, 'transacts'],
    [0, 0, 1, 2, 'streams'],
    [1, 1, 2, 0, 'mints'],
    [1, 1, 2, 1, 'feeds'],
    [1, 1, 2, 2, 'resolves'],
    [1, 1, 2, 3, 'mixes'],
];

function bezierPath(sx: number, sy: number, tx: number, ty: number) {
    const my = (sy + ty) / 2;
    return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
}

// Card component
function NodeCard({
    x, y, w, label, sub, color, theme,
}: {
    x: number; y: number; w: number; label: string; sub: string; color: string;
    theme: typeof themes.dark;
}) {
    return (
        <g>
            <rect
                x={x} y={y} width={w} height={CARD_H}
                rx={CARD_R} ry={CARD_R}
                fill={theme.cardFill}
                stroke={theme.cardStroke}
                strokeWidth="1"
                filter="url(#cardShadow)"
            />
            <circle cx={x + 24} cy={y + CARD_H / 2} r={GLOW_R} fill={color} opacity="0.12" />
            <circle cx={x + 24} cy={y + CARD_H / 2} r={DOT_R} fill={color} />
            <text
                x={x + 44} y={y + CARD_H / 2 - 4}
                fill={theme.text} fontSize="12.5" fontWeight="600"
                fontFamily="Inter, system-ui, -apple-system, sans-serif"
            >
                {label}
            </text>
            <text
                x={x + 44} y={y + CARD_H / 2 + 11}
                fill={theme.subText} fontSize="10"
                fontFamily="Inter, system-ui, -apple-system, sans-serif"
            >
                {sub}
            </text>
        </g>
    );
}

export default function ArchitectureDiagram() {
    const { colorMode } = useColorMode();
    const t = themes[colorMode] || themes.dark;

    return (
        <div
            style={{
                width: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1px solid ${t.border}`,
                background: t.bg,
            }}
        >
            <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                width="100%"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Oyrade Protocol Architecture Diagram"
                style={{ display: 'block' }}
            >
                <title>Oyrade Protocol Architecture</title>
                <defs>
                    <filter id="cardShadow" x="-8%" y="-8%" width="116%" height="130%">
                        <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#000" floodOpacity={t.shadowOpacity} />
                    </filter>
                    <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <circle cx="12" cy="12" r="0.6" fill={t.gridDot} />
                    </pattern>
                    <marker id="arrow" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                        <path d="M0,0 L6,2.5 L0,5" fill="none" stroke={t.line} strokeWidth="1" />
                    </marker>
                </defs>

                {/* Background grid */}
                <rect width={SVG_W} height={SVG_H} fill="url(#dotGrid)" />

                {/* Connection lines */}
                {connections.map(([sr, sc, tr, tc, label], i) => {
                    const sx = nodeCx(sr, sc);
                    const sy = cardBot(sr);
                    const tx = nodeCx(tr, tc);
                    const ty = cardTopY(tr);
                    const midX = (sx + tx) / 2;
                    const midY = (sy + ty) / 2;
                    return (
                        <g key={`conn-${i}`}>
                            <path
                                d={bezierPath(sx, sy, tx, ty)}
                                fill="none"
                                stroke={t.line}
                                strokeWidth="1.2"
                                strokeDasharray="5,4"
                                markerEnd="url(#arrow)"
                            />
                            <rect
                                x={midX - 22} y={midY - 7}
                                width="44" height="14"
                                rx="4" fill={t.labelBg} opacity="0.9"
                            />
                            <text
                                x={midX} y={midY + 3}
                                textAnchor="middle"
                                fill={t.label} fontSize="8.5" fontWeight="500"
                                fontFamily="Inter, system-ui, -apple-system, sans-serif"
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}

                {/* Layer labels & node cards */}
                {layers.map((layer, li) => (
                    <g key={`layer-${li}`}>
                        <text
                            x={SVG_W / 2} y={layerY[li].labelY}
                            textAnchor="middle"
                            fill={t.label} fontSize="9.5" fontWeight="600"
                            letterSpacing="0.1em"
                            fontFamily="Inter, system-ui, -apple-system, sans-serif"
                        >
                            {layer.label}
                        </text>
                        {layer.nodes.map((node, ni) => (
                            <NodeCard
                                key={`node-${li}-${ni}`}
                                x={rows[li][ni].x}
                                y={layerY[li].cardY}
                                w={rows[li][ni].w}
                                label={node.label}
                                sub={node.sub}
                                color={node.color}
                                theme={t}
                            />
                        ))}
                    </g>
                ))}
            </svg>
        </div>
    );
}

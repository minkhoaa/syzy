import React from 'react';
import Link from '@docusaurus/Link';
import { WalletPhantom, WalletSolflare, WalletBackpack } from '@web3icons/react';

const WalletList = [
    {
        name: 'Phantom',
        status: 'Recommended',
        mobile: true,
        url: 'https://phantom.app',
        color: '#AB9FF2',
        icon: <WalletPhantom size={32} />
    },
    {
        name: 'Solflare',
        status: 'Supported',
        mobile: true,
        url: 'https://solflare.com',
        color: '#FC7622',
        icon: <WalletSolflare size={32} />
    },
    {
        name: 'Backpack',
        status: 'Supported',
        mobile: true,
        url: 'https://backpack.app',
        color: '#E33E3F',
        icon: <WalletBackpack size={32} />
    },
];

export default function WalletCards(): JSX.Element {
    return (
        <div className="wallet-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginTop: '1.5rem',
            marginBottom: '2rem'
        }}>
            {WalletList.map((wallet) => (
                <Link
                    key={wallet.name}
                    href={wallet.url}
                    style={{
                        textDecoration: 'none',
                        color: 'inherit'
                    }}
                >
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '1.5rem',
                        transition: 'all 0.2s',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                        className="wallet-card"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = wallet.color;
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ color: wallet.color, display: 'flex' }}>
                                {wallet.icon}
                            </div>
                            {wallet.status === 'Recommended' && (
                                <span style={{
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    color: '#4ade80',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Best
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{wallet.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#a1a1aa' }}>
                                {wallet.mobile ? '📱 Mobile & Desktop' : '🖥 Desktop Only'}
                            </p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

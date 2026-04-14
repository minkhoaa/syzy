import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

// Changelog Data
const changelogData = [
    {
        date: 'Feb 19, 2026',
        title: 'Navigation Cleanup, Dark Mode Polish & Analytics',
        tag: 'Frontend',
        version: 'v0.4.0',
        content: (
            <>
                <p>Streamlined the app shell, polished the dark mode experience, and added analytics tracking.</p>
                <ul className="changelog-list">
                    <li><strong>App Shell Improvements</strong>:
                        <ul>
                            <li>Consolidated navigation into the sidebar and cleaned up the header for a more focused layout.</li>
                            <li>Fixed sidebar icon tooltips not appearing when collapsed.</li>
                        </ul>
                    </li>
                    <li><strong>Dark Mode</strong>:
                        <ul>
                            <li>Improved text contrast and background consistency across the landing page and wallet modal in dark mode.</li>
                        </ul>
                    </li>
                    <li><strong>Analytics</strong>:
                        <ul>
                            <li>Integrated Vercel Analytics and Google Analytics for usage insights.</li>
                        </ul>
                    </li>
                    <li><strong>Market News</strong>:
                        <ul>
                            <li>Added a curated news feed on each market detail page, surfacing relevant articles for the market's topic.</li>
                        </ul>
                    </li>
                </ul>
            </>
        ),
    },
    {
        date: 'Feb 11, 2026',
        title: 'Security Audit, Resolution Automation & Oracle Integration',
        tag: 'Platform',
        version: 'v0.3.1',
        content: (
            <>
                <p>Strengthened smart contract security, automated market lifecycle, and shipped on-demand oracle integration with a new charting experience.</p>
                <ul className="changelog-list">
                    <li><strong>Smart Contract Audit</strong>:
                        <ul>
                            <li>Improved security of core logic related to mathematical calculations and oracle resolution guard.</li>
                        </ul>
                    </li>
                    <li><strong>Resolution Enhancement</strong>:
                        <ul>
                            <li>Added configurable starting time and ending time for markets.</li>
                            <li>Markets now automatically close when their end time is reached.</li>
                        </ul>
                    </li>
                    <li><strong>Oracle Feed Integration</strong>:
                        <ul>
                            <li>Integrated on-demand Switchboard SDKs for real-time price data.</li>
                            <li>Added internal tooling for creating Switchboard-based oracle feeds and importing external ones during market setup (devnet testing).</li>
                        </ul>
                    </li>
                    <li><strong>Market Charts</strong>:
                        <ul>
                            <li>Added interactive price charts for each market on the detail page.</li>
                        </ul>
                    </li>
                </ul>
            </>
        ),
    },
    {
        date: 'Feb 04, 2026',
        title: 'Core Prediction Engine & Privacy Integration',
        tag: 'Smart Contract',
        version: 'v0.3.0',
        content: (
            <>
                <p>Incorporated zero-knowledge proofs and finalized the core prediction logic for the mainnet release.</p>
                <ul className="changelog-list">
                    <li><strong>Prediction Market Logic</strong>:
                        <ul>
                            <li>Implemented <code>place_prediction</code> instruction for on-chain integrity.</li>
                            <li>Integrated direct state fetching for real-time market updates.</li>
                            <li>Built intuitive Buy/Sell position interfaces.</li>
                        </ul>
                    </li>
                    <li><strong>Smart Contracts</strong>:
                        <ul>
                            <li>Finalized market resolution logic with redundant safety checks.</li>
                            <li>Optimized storage layout for high-throughput trading.</li>
                        </ul>
                    </li>
                    <li><strong>Privacy Layer</strong>:
                        <ul>
                            <li><strong>Shielded Predictions</strong>: Enabled private trading for Tier 3+ users.</li>
                            <li><strong>ZK Proofs</strong>: Integrated Groth16 verifier for trustless on-chain privacy.</li>
                        </ul>
                    </li>
                </ul>
            </>
        ),
    },
    {
        date: 'Feb 02, 2026',
        title: 'Portfolio Dashboard Redesign',
        tag: 'Frontend',
        version: 'v0.2.5',
        content: (
            <>
                <p>A complete visual overhaul of the portfolio dashboard, focusing on clarity and rapid decision-making.</p>
                <ul className="changelog-list">
                    <li><strong>New Dashboard Features</strong>:
                        <ul>
                            <li><strong>Seamless Toggle</strong>: Switch instantly between "Active Positions" and "History".</li>
                            <li><strong>PnL Tracking</strong>: Real-time profit/loss updates with dynamic color indicators.</li>
                            <li><strong>Asset Allocation</strong>: Interactive donut chart for portfolio visualization.</li>
                        </ul>
                    </li>
                    <li><strong>UI/UX Enhancements</strong>:
                        <ul>
                            <li>Adopted glassmorphism for position cards to match system aesthetics.</li>
                            <li>Refined mobile responsiveness for trading on the go.</li>
                        </ul>
                    </li>
                </ul>
                {/* <div className="media-preview">
                    <img src="https://pbs.twimg.com/media/Gi0_3w-bEAAw4J-.jpg" alt="Portfolio UI" />
                </div> */}
            </>
        ),
    },
    {
        date: 'Jan 29, 2026',
        title: 'Public Beta Launch',
        tag: 'Release',
        version: 'v0.2.0',
        content: (
            <>
                <p>Initial public release of the Oyrade application interface.</p>
                <ul className="changelog-list">
                    <li><strong>Landing Experience</strong>:
                        <ul>
                            <li><strong>Hero Section</strong>: Implemented 3D interactive elements for immersion.</li>
                            <li><strong>Scrollmation</strong>: "How it Works" section with scroll-triggered animations.</li>
                            <li><strong>Live Ticker</strong>: Real-time user statistics display.</li>
                        </ul>
                    </li>
                    <li><strong>Market Explorer</strong>:
                        <ul>
                            <li>Deployed grid view for browsing trending markets.</li>
                            <li>Added robust filtering for sectors (Crypto, Sports, Pop Culture).</li>
                        </ul>
                    </li>
                </ul>
            </>
        ),
    },
];

export default function Changelog(): JSX.Element {

    return (
        <Layout
            title="Changelog"
            description="Oyrade Platform Updates & Release Notes">

            <div className="changelog-container">
                {/* Header */}
                <div className="changelog-header">
                    <div className="container">
                        <h1>Changelog</h1>
                        <p>Latest updates, improvements, and features from the Oyrade team.</p>
                    </div>
                </div>

                <div className="container padding-vert--lg">
                    <div className="row">
                        {/* Timeline Column */}
                        <div className="col col--8 col--offset-2">
                            <div className="timeline">
                                {changelogData.map((item, index) => (
                                    <div key={index} className="timeline-item">
                                        {/* Date Marker (Left side desktop / Top mobile) */}
                                        <div className="timeline-date">
                                            <span>{item.date}</span>
                                        </div>

                                        {/* Content Card */}
                                        <div className="timeline-content card">
                                            <div className="card__header">
                                                <div className="timeline-badges">
                                                    <span className={`badge badge--${item.tag === 'Frontend' ? 'primary' : 'secondary'}`}>
                                                        {item.tag}
                                                    </span>
                                                    <span className="badge badge--outline">{item.version}</span>
                                                </div>
                                                <h3>{item.title}</h3>
                                            </div>
                                            <div className="card__body">
                                                {item.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Sidebar (Optional, for links/subscribe) */}
                        <div className="col col--2">
                            <div className="changelog-sidebar">
                                <div className="changelog-sidebar-section">
                                    <h4>Stay Updated</h4>
                                    <Link href="https://twitter.com/OyradeX" className="button button--secondary button--block button--sm">
                                        Follow on X
                                    </Link>
                                    <Link href="https://discord.gg/fB6zG5Ck5q" className="button button--outline button--primary button--block button--sm margin-top--sm">
                                        Join Discord
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

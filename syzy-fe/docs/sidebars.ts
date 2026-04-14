import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Overview',
      collapsed: false,
      items: [
        'intro',
        'overview/problem-solution',
        'overview/how-it-works',
        'overview/strategic-differentiation',
        'overview/highlight-features',
      ],
    },
    {
      type: 'category',
      label: 'Get Started',
      collapsed: false,
      items: [
        'get-started/connect-wallet',
        'get-started/funding-your-wallet',
      ],
    },
    {
      type: 'category',
      label: 'Trade on Oyrade',
      collapsed: false,
      items: [
        'trade-on-oyrade/trading-basics',
        'trade-on-oyrade/how-to-place-predictions',
        'trade-on-oyrade/tracking-positions',
        'trade-on-oyrade/withdraw-funds',
        'trade-on-oyrade/fees',
      ],
    },
    {
      type: 'category',
      label: 'Markets',
      items: [
        'markets/how-markets-are-created',
        'markets/how-markets-are-resolved',
      ],
    },
    {
      type: 'category',
      label: 'Privacy',
      items: [
        'privacy/shielded-predictions',
        'privacy/how-privacy-works',
      ],
    },
    {
      type: 'category',
      label: '$OYRADE Token',
      items: [
        'token/utility-overview',
        'token/governance',
        'token/tier-system',
        'token/faucet',
      ],
    },
    {
      type: 'category',
      label: 'About Us',
      items: [
        'about/brand-assets',
        'about/support',
      ],
    },
  ],
  developersSidebar: [
    {
      type: 'category',
      label: 'For Developers',
      collapsed: false,
      items: [
        'developers/overview',
        'developers/smart-contracts',
        'developers/api-reference',
      ],
    },
  ],
};

export default sidebars;

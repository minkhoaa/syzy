import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Oyrade',
  tagline: 'Privacy-First Prediction Markets on Solana',
  favicon: 'img/logo.png',

  url: 'https://docs.oyrade.com',
  baseUrl: '/',

  organizationName: 'oyrade',
  projectName: 'oyrade-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Docs at root
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'img/oyrade-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '', // Hide title text (logo has text)
      logo: {
        alt: 'Oyrade Logo',
        src: 'img/oyrade-logo-combined.jpg', // Updated logo
        style: { height: '32px' }, 
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'User Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'developersSidebar',
          position: 'left',
          label: 'For Developers',
        },
        {
          to: '/changelog',
          label: 'Changelog',
          position: 'left',
        },
        {
          href: 'https://oyrade.com',
          label: 'Main Site',
          position: 'right',
          className: 'navbar-main-site-link',
        },
      ],
    },
    // Footer removed as requested
    /* footer: {
      style: 'dark',
      links: [],
      copyright: `© ${new Date().getFullYear()} Oyrade. All Rights Reserved.`,
    }, */
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'solidity', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

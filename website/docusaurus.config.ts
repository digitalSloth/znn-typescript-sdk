import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'ZNN TypeScript SDK',
  tagline: 'TypeScript/JavaScript SDK for the Zenon Network of Momentum',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://digitalsloth.github.io',
  baseUrl: '/znn-typescript-sdk/',

  // GitHub pages deployment config.
  organizationName: 'digitalSloth',
  projectName: 'znn-typescript-sdk',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/digitalSloth/znn-typescript-sdk/tree/main/website/',
        },
        blog: false,
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsRouteBasePath: '/',
        indexBlog: false,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ZNN TypeScript SDK',
      logo: {
        alt: 'Zenon Network logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/znn-typescript-sdk',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/digitalSloth/znn-typescript-sdk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Getting Started', to: '/'},
            {label: 'API Overview', to: '/api-overview'},
            {label: 'Examples', to: '/examples'},
            {label: 'CLI', to: '/cli'},
          ],
        },
        {
          title: 'Ecosystem',
          items: [
            {label: 'Zenon Network', href: 'https://zenon.network'},
            {label: 'Zenon Hub', href: 'https://zenonhub.io'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/digitalSloth/znn-typescript-sdk',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/znn-typescript-sdk',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} digitalSloth. Licensed under MIT.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'index',
    'api-overview',
    'wallet',
    'utilities',
    'examples',
    'cli',
    'build-wasm',
  ],
};

export default sidebars;

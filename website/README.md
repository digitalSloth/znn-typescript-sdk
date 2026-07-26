# Documentation Website

Documentation site for the ZNN TypeScript SDK, built with [Docusaurus](https://docusaurus.io/) and themed with the [Zenon Design System](https://github.com/digitalSloth/zenon-design-system). Full-text search is provided offline by [@easyops-cn/docusaurus-search-local](https://github.com/easyops-cn/docusaurus-search-local) — no external search service required.

## Installation

```bash
cd website
npm install
```

## Local Development

```bash
npm run start
```

Starts a local development server at http://localhost:3000/znn-typescript-sdk/ with live reload. Note: the local search index is only built for production builds — use `npm run build && npm run serve` to test search.

## Build

```bash
npm run build
```

Generates static content into the `build` directory, which can be served by any static hosting service:

```bash
npm run serve
```

From the repository root you can also run `npm run docs:start` / `npm run docs:build`.

## Adding Docs

Doc pages live in `website/docs/` as Markdown. The sidebar order is defined explicitly in `sidebars.ts` — add new page IDs there. The Zenon design tokens (colors, Space Grotesk / JetBrains Mono typography, radius) are mapped onto Docusaurus/Infima variables in `src/css/custom.css`.

## Deployment

The site builds to static files with `baseUrl: /znn-typescript-sdk/`, ready for GitHub Pages:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

Using SSH:

```bash
USE_SSH=true npm run deploy
```

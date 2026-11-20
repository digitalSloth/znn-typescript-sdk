/**
 * Generates docs/index.md, the site's Getting Started page, from the
 * repository README so the README stays the single source of truth.
 * Runs before `start` and `build` (see package.json). The output is
 * gitignored; edit README.md instead.
 */

import { readFileSync, writeFileSync } from "node:fs";

const readmePath = new URL("../../README.md", import.meta.url);
const indexPath = new URL("../../docs/index.md", import.meta.url);

const frontmatter = `---
slug: /
title: Getting Started
description: Install the ZNN TypeScript SDK and connect to the Zenon Network of Momentum.
custom_edit_url: https://github.com/digitalSloth/znn-typescript-sdk/tree/main/README.md
---
`;

const body = readFileSync(readmePath, "utf8")
    // The site supplies its own title, and the status badges only suit GitHub.
    .replace(/^# .*$/m, "# Getting Started")
    .replace(/^\[!\[.*$\n?/gm, "")
    // README links point into docs/; on the site the pages are siblings.
    .replace(/\]\(\.\/docs\//g, "](./")
    .replace(/\n{3,}/g, "\n\n");

writeFileSync(indexPath, `${frontmatter}\n${body}`);

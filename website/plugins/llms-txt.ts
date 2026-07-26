import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type {LoadContext, Plugin} from '@docusaurus/types';
import sidebars from '../sidebars';

/**
 * Generates LLM-friendly artifacts alongside the static build, following
 * the llms.txt convention (https://llmstxt.org/):
 *
 *   /llms.txt        - index of all doc pages with links to markdown versions
 *   /llms-full.txt   - every doc page concatenated into one markdown file
 *   /<page>.md       - raw markdown mirror of each doc page
 *                      (the homepage mirrors to /index.html.md per the spec)
 *
 * The page list is derived from sidebars.ts, so new docs are picked up
 * automatically once they are added to the sidebar.
 */

function flattenSidebarIds(items: readonly unknown[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      ids.push(item);
    } else if (item && typeof item === 'object') {
      const entry = item as {type?: string; id?: string; items?: unknown[]};
      if (entry.type === 'doc' && entry.id) {
        ids.push(entry.id);
      }
      if (Array.isArray(entry.items)) {
        ids.push(...flattenSidebarIds(entry.items));
      }
    }
  }
  return ids;
}

type ParsedDoc = {
  id: string;
  title: string;
  description: string;
  body: string;
  /** Site-relative page path without leading slash; '' for the homepage. */
  pagePath: string;
  /** Filename of the raw markdown mirror within the build dir. */
  mirrorFile: string;
};

function parseDoc(docsDir: string, id: string): ParsedDoc {
  const raw = fs.readFileSync(path.join(docsDir, `${id}.md`), 'utf8');
  const {data, content} = matter(raw);
  const body = content.trim();

  const h1 = body.match(/^#\s+(.+)$/m);
  const slug = typeof data.slug === 'string' ? data.slug : undefined;
  const pagePath = slug === '/' ? '' : (slug ?? id).replace(/^\//, '');

  return {
    id,
    title:
      (typeof data.title === 'string' && data.title) ||
      (h1 ? h1[1].trim() : id),
    description:
      typeof data.description === 'string' ? data.description : '',
    body,
    pagePath,
    // The llms.txt spec appends .md to the page URL, and uses index.html.md
    // for URLs that end in a bare directory path.
    mirrorFile: pagePath === '' ? 'index.html.md' : `${pagePath}.md`,
  };
}

export default function llmsTxtPlugin(context: LoadContext): Plugin {
  return {
    name: 'llms-txt',

    async postBuild({outDir}) {
      const docsDir = path.join(context.siteDir, 'docs');
      const siteUrl = context.siteConfig.url + context.siteConfig.baseUrl;
      const docIds = Object.values(sidebars).flatMap((sidebar) =>
        Array.isArray(sidebar) ? flattenSidebarIds(sidebar) : [],
      );
      const docs = docIds.map((id) => parseDoc(docsDir, id));

      // Raw markdown mirrors next to each page.
      for (const doc of docs) {
        const mirrorPath = path.join(outDir, doc.mirrorFile);
        fs.mkdirSync(path.dirname(mirrorPath), {recursive: true});
        fs.writeFileSync(mirrorPath, doc.body + '\n');
      }

      const index = [
        `# ${context.siteConfig.title}`,
        '',
        `> ${context.siteConfig.tagline}. Wallet management, transaction signing with automatic PoW, and real-time WebSocket subscriptions for Node.js and browsers.`,
        '',
        'The full documentation is also available as a single file at ' +
          `${siteUrl}llms-full.txt`,
        '',
        '## Documentation',
        '',
        ...docs.map(
          (doc) =>
            `- [${doc.title}](${siteUrl}${doc.mirrorFile}): ${doc.description}`,
        ),
        '',
        '## Optional',
        '',
        '- [GitHub repository](https://github.com/digitalSloth/znn-typescript-sdk): source code, issues and releases',
        '- [npm package](https://www.npmjs.com/package/znn-typescript-sdk): published releases',
        '- [Zenon Network](https://zenon.network): the Network of Momentum',
        '',
      ].join('\n');
      fs.writeFileSync(path.join(outDir, 'llms.txt'), index);

      const full = [
        `# ${context.siteConfig.title} — Full Documentation`,
        '',
        `> ${context.siteConfig.tagline}`,
        '',
        ...docs.flatMap((doc) => [
          '---',
          '',
          `<!-- Source: ${siteUrl}${doc.pagePath} -->`,
          '',
          doc.body,
          '',
        ]),
      ].join('\n');
      fs.writeFileSync(path.join(outDir, 'llms-full.txt'), full);
    },
  };
}

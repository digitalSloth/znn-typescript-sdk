import fs from 'node:fs';
import path from 'node:path';
import type {LoadContext, Plugin} from '@docusaurus/types';

/**
 * Generates LLM-friendly artifacts alongside the static build, following
 * the llms.txt convention (https://llmstxt.org/):
 *
 *   /llms.txt       - index of all doc pages with links to markdown versions
 *   /llms-full.txt  - every doc page concatenated into one markdown file
 *   /<page>.md      - raw markdown mirror of each doc page
 */

// Keep in the same order as sidebars.ts so llms.txt reads like the sidebar.
const DOC_IDS = [
  'index',
  'api-overview',
  'wallet',
  'utilities',
  'examples',
  'cli',
  'build-wasm',
];

type ParsedDoc = {
  id: string;
  title: string;
  description: string;
  body: string;
};

function parseDoc(docsDir: string, id: string): ParsedDoc {
  const raw = fs.readFileSync(path.join(docsDir, `${id}.md`), 'utf8');

  let frontmatter = '';
  let body = raw;
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (match) {
    frontmatter = match[1];
    body = raw.slice(match[0].length);
  }

  const fmField = (name: string): string => {
    const m = frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  };

  const h1 = body.match(/^#\s+(.+)$/m);
  return {
    id,
    title: fmField('title') || (h1 ? h1[1].trim() : id),
    description: fmField('description'),
    body: body.trim(),
  };
}

export default function llmsTxtPlugin(context: LoadContext): Plugin<void> {
  return {
    name: 'llms-txt',

    async postBuild({outDir}) {
      const docsDir = path.join(context.siteDir, 'docs');
      const siteUrl = context.siteConfig.url + context.siteConfig.baseUrl;
      const docs = DOC_IDS.map((id) => parseDoc(docsDir, id));

      // Raw markdown mirrors next to each page.
      for (const doc of docs) {
        fs.writeFileSync(path.join(outDir, `${doc.id}.md`), doc.body + '\n');
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
          (doc) => `- [${doc.title}](${siteUrl}${doc.id}.md): ${doc.description}`,
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
          `<!-- Source: ${siteUrl}${doc.id === 'index' ? '' : doc.id} -->`,
          '',
          doc.body,
          '',
        ]),
      ].join('\n');
      fs.writeFileSync(path.join(outDir, 'llms-full.txt'), full);
    },
  };
}

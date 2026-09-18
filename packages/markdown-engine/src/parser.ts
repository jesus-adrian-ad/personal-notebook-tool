import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import type { Root as HastRoot } from 'hast';
import { remarkCodeBlock } from './plugins/remark-code-block';
import { remarkTableSource } from './plugins/remark-table-source';
import { rehypeUrlEmbed } from './plugins/rehype-url-embed';

/**
 * Markdown body -> hast pipeline shared by the live preview, PDF/HTML export
 * and any future consumer. Frontmatter is parsed and stripped upstream by
 * gray-matter (apps/main/src/fs/frontmatter.ts) before the body reaches this
 * parser — remarkFrontmatter here only guards against a stray `---` block
 * surviving into the body so it doesn't get misread as a thematic break.
 */
export function parseMarkdownToHast(source: string): HastRoot {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkCodeBlock)
    .use(remarkTableSource)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeUrlEmbed);

  const mdast = processor.parse(source);
  return processor.runSync(mdast) as HastRoot;
}

export { serializeTable, type TableModel } from './plugins/remark-table-source';

import { describe, expect, it } from 'vitest';
import { parseMarkdownToHast } from './parser';

function findAll(node: any, tagName: string, acc: any[] = []): any[] {
  if (node.tagName === tagName) acc.push(node);
  for (const child of node.children ?? []) findAll(child, tagName, acc);
  return acc;
}

describe('parseMarkdownToHast', () => {
  it('renders standard GFM (headers, lists) unchanged', () => {
    const hast = parseMarkdownToHast('# Title\n\n- one\n- two\n');
    expect(findAll(hast, 'h1')).toHaveLength(1);
    expect(findAll(hast, 'li')).toHaveLength(2);
  });

  it('turns any fenced code block into a code-block element, whatever the language', () => {
    const hast = parseMarkdownToHast('```python\nprint(1)\n```\n');
    const blocks = findAll(hast, 'code-block');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].properties.language).toBe('python');
    expect(blocks[0].properties.code).toBe('print(1)');
    expect(blocks[0].properties.blockIndex).toBe(0);
  });

  it('does not restrict or normalize the language — any info string is accepted as-is', () => {
    const hast = parseMarkdownToHast('```csharp\nConsole.WriteLine(1);\n```\n');
    const blocks = findAll(hast, 'code-block');
    expect(blocks[0].properties.language).toBe('csharp');
  });

  it('labels a fenced block with no language as "texto"', () => {
    const hast = parseMarkdownToHast('```\nplain text\n```\n');
    const blocks = findAll(hast, 'code-block');
    expect(blocks[0].properties.language).toBe('texto');
  });

  it('assigns sequential blockIndex across multiple code blocks', () => {
    const hast = parseMarkdownToHast('```js\n1\n```\n\n```sql\nselect 1;\n```\n');
    const blocks = findAll(hast, 'code-block');
    expect(blocks.map((b) => b.properties.blockIndex)).toEqual([0, 1]);
    expect(blocks.map((b) => b.properties.language)).toEqual(['js', 'sql']);
  });

  it('converts a GFM table into a markdown-table element carrying the row model', () => {
    const hast = parseMarkdownToHast('| a | b |\n| --- | --- |\n| 1 | 2 |\n');
    const tables = findAll(hast, 'markdown-table');
    expect(tables).toHaveLength(1);
    const model = JSON.parse(tables[0].properties.model);
    expect(model.rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('converts a bare URL paragraph into a url-embed element', () => {
    const hast = parseMarkdownToHast('https://example.com\n');
    const embeds = findAll(hast, 'url-embed');
    expect(embeds).toHaveLength(1);
    expect(embeds[0].properties.href).toBe('https://example.com');
  });

  it('leaves a URL inside a normal sentence as a plain link', () => {
    const hast = parseMarkdownToHast('See https://example.com for more.\n');
    expect(findAll(hast, 'url-embed')).toHaveLength(0);
    expect(findAll(hast, 'a')).toHaveLength(1);
  });
});

import { visit } from 'unist-util-visit';
import type { Root, Code } from 'mdast';
import type { Plugin } from 'unified';

/**
 * Every fenced code block becomes a labeled card in the preview — language
 * badge + monospace body — regardless of what language string the user
 * types (java, javascript, sql, csharp, ...). This is documentation only:
 * there is no execution, so any language works with no special-casing.
 */
export const remarkCodeBlock: Plugin<[], Root> = () => {
  return (tree) => {
    let blockIndex = 0;
    visit(tree, 'code', (node: Code) => {
      const data = node.data ?? (node.data = {});
      data.hName = 'code-block';
      data.hProperties = {
        language: node.lang?.trim() || 'texto',
        code: node.value,
        blockIndex: blockIndex++,
      };
    });
  };
};

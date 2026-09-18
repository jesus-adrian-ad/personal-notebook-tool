import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';

function isBareUrlParagraph(node: Element): string | null {
  if (node.tagName !== 'p' || node.children.length !== 1) return null;
  const child = node.children[0];
  if (!child || child.type !== 'element' || child.tagName !== 'a' || child.children.length !== 1) return null;
  const textNode = child.children[0];
  if (!textNode || textNode.type !== 'text') return null;
  const href = child.properties?.href;
  if (typeof href !== 'string' || href !== textNode.value) return null;
  return href;
}

/**
 * A paragraph containing only a single autolinked URL (i.e. a URL pasted on
 * its own line) becomes a rich resource embed showing the cached
 * title/favicon from url_previews, instead of a plain blue link.
 */
export const rehypeUrlEmbed: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return;
      const href = isBareUrlParagraph(node);
      if (!href) return;

      const replacement: Element = {
        type: 'element',
        tagName: 'url-embed',
        properties: { href },
        children: [],
      };
      (parent.children as Element[])[index] = replacement;
    });
  };
};

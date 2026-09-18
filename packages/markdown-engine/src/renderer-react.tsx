import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import type { Root as HastRoot } from 'hast';
import type { ComponentType, ReactNode } from 'react';

export interface CodeBlockProps {
  language: string;
  code: string;
  blockIndex: number;
}

export interface MarkdownTableProps {
  tableIndex: number;
  /** JSON-serialized TableModel, see plugins/remark-table-source.ts */
  model: string;
}

export interface UrlEmbedProps {
  href: string;
}

export interface MarkdownComponents {
  CodeBlock: ComponentType<CodeBlockProps>;
  MarkdownTable: ComponentType<MarkdownTableProps>;
  UrlEmbed: ComponentType<UrlEmbedProps>;
}

/**
 * hast-util-to-jsx-runtime types `components` against known HTML tag names
 * only; our code-block/markdown-table/url-embed hNames are intentional
 * custom elements the plugins emit (see plugins/*), so the map is cast past
 * that restriction here rather than widening the library's public type.
 */
type CustomComponentsMap = Record<string, ComponentType<Record<string, unknown>>>;

/** Maps the hast tree produced by parseMarkdownToHast into React elements for the preview pane. */
export function renderHastToReact(hast: HastRoot, components: MarkdownComponents): ReactNode {
  const customComponents: CustomComponentsMap = {
    'code-block': components.CodeBlock as unknown as ComponentType<Record<string, unknown>>,
    'markdown-table': components.MarkdownTable as unknown as ComponentType<Record<string, unknown>>,
    'url-embed': components.UrlEmbed as unknown as ComponentType<Record<string, unknown>>,
  };

  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: customComponents as Parameters<typeof toJsxRuntime>[1]['components'],
  });
}

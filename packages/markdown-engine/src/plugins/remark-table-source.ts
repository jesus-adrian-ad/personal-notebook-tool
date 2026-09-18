import { visit } from 'unist-util-visit';
import { toString as mdastToString } from 'mdast-util-to-string';
import type { Root, Table } from 'mdast';
import type { Plugin } from 'unified';

export type ColumnAlign = 'left' | 'right' | 'center' | null;

export interface TableModel {
  tableIndex: number;
  align: ColumnAlign[];
  rows: string[][];
  /** Byte offsets of the table's exact span in the source markdown, used by the visual editor to replace it in place. */
  startOffset: number;
  endOffset: number;
}

/**
 * Extracts each GFM table into a plain rows/align model the visual TableEditor
 * consumes directly, instead of forcing it to re-parse rendered <table> HTML.
 * The editor serializes edits back to GFM via `serializeTable` and replaces
 * the corresponding range in the source CodeMirror document.
 */
export const remarkTableSource: Plugin<[], Root> = () => {
  return (tree) => {
    let tableIndex = 0;
    visit(tree, 'table', (node: Table) => {
      const rows = node.children.map((row) => row.children.map((cell) => mdastToString(cell)));
      const model: TableModel = {
        tableIndex: tableIndex++,
        align: node.align ?? [],
        rows,
        startOffset: node.position?.start.offset ?? 0,
        endOffset: node.position?.end.offset ?? 0,
      };

      const data = node.data ?? (node.data = {});
      data.hName = 'markdown-table';
      data.hProperties = {
        tableIndex: model.tableIndex,
        model: JSON.stringify(model),
      };
    });
  };
};

export function serializeTable(model: TableModel): string {
  const { rows, align } = model;
  if (rows.length === 0) return '';
  const header = rows[0] ?? [];
  const body = rows.slice(1);
  const colCount = header.length;

  const alignToken = (a: ColumnAlign | undefined): string => {
    if (a === 'left') return ':---';
    if (a === 'right') return '---:';
    if (a === 'center') return ':---:';
    return '---';
  };

  const formatRow = (cells: string[]): string =>
    `| ${Array.from({ length: colCount }, (_, i) => (cells[i] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`;

  const separator = `| ${Array.from({ length: colCount }, (_, i) => alignToken(align[i])).join(' | ')} |`;

  return [formatRow(header), separator, ...body.map(formatRow)].join('\n');
}

import { useEffect, useState } from 'react';
import { serializeTable, type TableModel } from '@notebook/markdown-engine';

interface Props {
  model: TableModel;
  /** Replaces the table's exact source span (startOffset..endOffset) with newly serialized GFM markdown. */
  onCommit: (startOffset: number, endOffset: number, markdown: string) => void;
}

/**
 * A spreadsheet-like grid over one GFM table. Edits are local until a cell
 * loses focus, then the whole table re-serializes and replaces its source
 * range via CodeMirror (see CodeMirrorEditor.replaceRange) — CodeMirror stays
 * the single source of truth, this component just re-syncs from the parsed
 * `model` prop whenever the source changes underneath it.
 */
export function TableEditor({ model, onCommit }: Props) {
  const [rows, setRows] = useState(model.rows);

  useEffect(() => {
    setRows(model.rows);
  }, [model]);

  const colCount = rows[0]?.length ?? 0;

  const commit = (nextRows: string[][]) => {
    setRows(nextRows);
    const markdown = serializeTable({ ...model, rows: nextRows });
    onCommit(model.startOffset, model.endOffset, markdown);
  };

  const setCell = (rowIndex: number, colIndex: number, value: string) => {
    const next = rows.map((row, ri) => (ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : row));
    setRows(next);
  };

  const addRow = () => commit([...rows, Array.from({ length: colCount }, () => '')]);
  const removeRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    commit(rows.filter((_, ri) => ri !== rowIndex));
  };
  const addColumn = () => commit(rows.map((row) => [...row, '']));
  const removeColumn = (colIndex: number) => {
    if (colCount <= 1) return;
    commit(rows.map((row) => row.filter((_, ci) => ci !== colIndex)));
  };

  return (
    <div className="my-2">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={`border border-brand-100 p-0 dark:border-slate-700 ${
                    rowIndex === 0 ? 'bg-brand-50 dark:bg-slate-800' : ''
                  }`}
                >
                  <input
                    value={cell}
                    onChange={(e) => setCell(rowIndex, colIndex, e.target.value)}
                    onBlur={() => commit(rows)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className={`w-full bg-transparent px-2 py-1 outline-none focus:bg-white dark:focus:bg-slate-900 ${
                      rowIndex === 0 ? 'font-display font-bold text-brand-700 dark:text-brand-300' : 'text-ink dark:text-slate-100'
                    }`}
                  />
                </td>
              ))}
              <td className="border-none p-0 pl-1 align-top">
                <button
                  type="button"
                  title="Eliminar fila"
                  onClick={() => removeRow(rowIndex)}
                  className="text-xs text-muted hover:text-red-600 dark:text-muted-dark"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
          <tr>
            {Array.from({ length: colCount }, (_, colIndex) => (
              <td key={colIndex} className="border-none p-0 pt-1 text-center">
                <button
                  type="button"
                  title="Eliminar columna"
                  onClick={() => removeColumn(colIndex)}
                  className="text-xs text-muted hover:text-red-600 dark:text-muted-dark"
                >
                  ✕
                </button>
              </td>
            ))}
            <td />
          </tr>
        </tbody>
      </table>
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded border border-accent-600 px-2 py-0.5 text-xs font-semibold text-accent-700 hover:bg-accent-50 dark:text-accent-400"
        >
          + Fila
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="rounded border border-accent-600 px-2 py-0.5 text-xs font-semibold text-accent-700 hover:bg-accent-50 dark:text-accent-400"
        >
          + Columna
        </button>
      </div>
    </div>
  );
}

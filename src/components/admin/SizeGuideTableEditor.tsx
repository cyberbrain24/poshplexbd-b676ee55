import { useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SizeGuideTableData {
  columns: string[];
  rows: string[][];
}

interface SizeGuideTableEditorProps {
  value: SizeGuideTableData;
  onChange: (data: SizeGuideTableData) => void;
}

const DEFAULT_TABLE: SizeGuideTableData = {
  columns: ["Size"],
  rows: [[""]],
};

/**
 * Parse the stored content string into table data.
 * Supports JSON format or falls back to legacy text.
 */
export const parseSizeGuideContent = (content: string): SizeGuideTableData | null => {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed.columns && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
      return parsed as SizeGuideTableData;
    }
  } catch {
    // Not JSON — legacy text content
  }
  return null;
};

export const serializeSizeGuideTable = (data: SizeGuideTableData): string => {
  return JSON.stringify(data);
};

const SizeGuideTableEditor = ({ value, onChange }: SizeGuideTableEditorProps) => {
  const table = value;

  const updateCell = useCallback(
    (rowIdx: number, colIdx: number, val: string) => {
      const newRows = table.rows.map((r, ri) =>
        ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? val : c)) : [...r]
      );
      onChange({ ...table, rows: newRows });
    },
    [table, onChange]
  );

  const updateColumnHeader = useCallback(
    (colIdx: number, val: string) => {
      const newColumns = table.columns.map((c, i) => (i === colIdx ? val : c));
      onChange({ ...table, columns: newColumns });
    },
    [table, onChange]
  );

  const addColumn = useCallback(() => {
    const newColumns = [...table.columns, `Column ${table.columns.length + 1}`];
    const newRows = table.rows.map((r) => [...r, ""]);
    onChange({ columns: newColumns, rows: newRows });
  }, [table, onChange]);

  const removeColumn = useCallback(
    (colIdx: number) => {
      if (table.columns.length <= 1) return;
      const newColumns = table.columns.filter((_, i) => i !== colIdx);
      const newRows = table.rows.map((r) => r.filter((_, i) => i !== colIdx));
      onChange({ columns: newColumns, rows: newRows });
    },
    [table, onChange]
  );

  const addRow = useCallback(() => {
    const newRow = table.columns.map(() => "");
    onChange({ ...table, rows: [...table.rows, newRow] });
  }, [table, onChange]);

  const removeRow = useCallback(
    (rowIdx: number) => {
      if (table.rows.length <= 1) return;
      onChange({ ...table, rows: table.rows.filter((_, i) => i !== rowIdx) });
    },
    [table, onChange]
  );

  return (
    <div className="space-y-3">
      <Label>Size Chart Table</Label>

      <div className="overflow-x-auto border border-border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {table.columns.map((col, colIdx) => (
                <th key={colIdx} className="p-1 border-r border-b border-border last:border-r-0">
                  <div className="flex items-center gap-1">
                    <Input
                      value={col}
                      onChange={(e) => updateColumnHeader(colIdx, e.target.value)}
                      className="h-8 text-xs font-medium border-0 bg-transparent p-1 focus-visible:ring-0"
                      placeholder="Header"
                    />
                    {table.columns.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeColumn(colIdx)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10 border-b border-border" />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border last:border-b-0">
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="p-1 border-r border-border last:border-r-0">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      className="h-8 text-xs border-0 bg-transparent p-1 focus-visible:ring-0"
                      placeholder="—"
                    />
                  </td>
                ))}
                <td className="p-1 w-10">
                  {table.rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeRow(rowIdx)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" /> Add Row
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-3 w-3 mr-1" /> Add Column
        </Button>
      </div>
    </div>
  );
};

export { DEFAULT_TABLE };
export default SizeGuideTableEditor;

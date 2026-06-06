import { useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SizeTable {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface SizeGuideTableData {
  tables: SizeTable[];
}

interface SizeGuideTableEditorProps {
  value: SizeGuideTableData;
  onChange: (data: SizeGuideTableData) => void;
}

const makeEmptyTable = (): SizeTable => ({
  title: "",
  columns: ["Size"],
  rows: [[""]],
});

const DEFAULT_TABLE: SizeGuideTableData = {
  tables: [makeEmptyTable()],
};

/**
 * Parse the stored content string into multi-table data.
 * Supports new multi-table JSON, legacy single-table JSON, or null for legacy text.
 */
export const parseSizeGuideContent = (content: string): SizeGuideTableData | null => {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.tables)) {
      const tables: SizeTable[] = parsed.tables
        .filter((t: any) => t && Array.isArray(t.columns) && Array.isArray(t.rows))
        .map((t: any) => ({
          title: typeof t.title === "string" ? t.title : "",
          columns: t.columns,
          rows: t.rows,
        }));
      if (tables.length > 0) return { tables };
    }
    if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
      return {
        tables: [{ title: "", columns: parsed.columns, rows: parsed.rows }],
      };
    }
  } catch {
    // Not JSON — legacy text content
  }
  return null;
};

export const serializeSizeGuideTable = (data: SizeGuideTableData): string => {
  const tables = data.tables && data.tables.length > 0 ? data.tables : [makeEmptyTable()];
  const payload: any = { tables };
  // Forward-safety: if only one untitled table, also expose legacy keys
  if (tables.length === 1 && !tables[0].title) {
    payload.columns = tables[0].columns;
    payload.rows = tables[0].rows;
  }
  return JSON.stringify(payload);
};

const SizeGuideTableEditor = ({ value, onChange }: SizeGuideTableEditorProps) => {
  const tables = value.tables && value.tables.length > 0 ? value.tables : [makeEmptyTable()];

  const update = useCallback(
    (idx: number, next: SizeTable) => {
      const newTables = tables.map((t, i) => (i === idx ? next : t));
      onChange({ tables: newTables });
    },
    [tables, onChange]
  );

  const addTable = useCallback(() => {
    onChange({ tables: [...tables, makeEmptyTable()] });
  }, [tables, onChange]);

  const removeTable = useCallback(
    (idx: number) => {
      if (tables.length <= 1) return;
      onChange({ tables: tables.filter((_, i) => i !== idx) });
    },
    [tables, onChange]
  );

  return (
    <div className="space-y-5">
      {tables.map((table, tIdx) => {
        const updateCell = (rowIdx: number, colIdx: number, val: string) => {
          const newRows = table.rows.map((r, ri) =>
            ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? val : c)) : [...r]
          );
          update(tIdx, { ...table, rows: newRows });
        };
        const updateColumnHeader = (colIdx: number, val: string) => {
          update(tIdx, {
            ...table,
            columns: table.columns.map((c, i) => (i === colIdx ? val : c)),
          });
        };
        const addColumn = () =>
          update(tIdx, {
            ...table,
            columns: [...table.columns, `Column ${table.columns.length + 1}`],
            rows: table.rows.map((r) => [...r, ""]),
          });
        const removeColumn = (colIdx: number) => {
          if (table.columns.length <= 1) return;
          update(tIdx, {
            ...table,
            columns: table.columns.filter((_, i) => i !== colIdx),
            rows: table.rows.map((r) => r.filter((_, i) => i !== colIdx)),
          });
        };
        const addRow = () =>
          update(tIdx, { ...table, rows: [...table.rows, table.columns.map(() => "")] });
        const removeRow = (rowIdx: number) => {
          if (table.rows.length <= 1) return;
          update(tIdx, { ...table, rows: table.rows.filter((_, i) => i !== rowIdx) });
        };

        return (
          <div key={tIdx} className="space-y-3 border border-border rounded p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Table Name</Label>
                <Input
                  value={table.title}
                  onChange={(e) => update(tIdx, { ...table, title: e.target.value })}
                  placeholder={`e.g., T-Shirt${tables.length > 1 ? ` / Table ${tIdx + 1}` : ""}`}
                  className="h-9"
                />
              </div>
              {tables.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTable(tIdx)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              )}
            </div>

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
      })}

      <Button type="button" variant="outline" size="sm" onClick={addTable}>
        <Plus className="h-3 w-3 mr-1" /> Add Table
      </Button>
    </div>
  );
};

export { DEFAULT_TABLE };
export default SizeGuideTableEditor;

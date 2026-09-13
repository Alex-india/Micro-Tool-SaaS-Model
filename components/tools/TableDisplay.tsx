"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

export interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (val: any) => string;
}

export interface TableDisplayProps {
  title?: string;
  columns: ColumnDef[];
  data: any[];
  pageSize?: number;
}

export const TableDisplay = React.memo<TableDisplayProps>(({
  title,
  columns,
  data,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (!data || data.length === 0) return null;

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const downloadCSV = () => {
    const headers = columns.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      columns.map((c) => (c.format ? c.format(row[c.key]) : row[c.key])).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title || "table_export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {title && <h4 className="text-xs sm:text-sm font-bold text-text-primary">{title}</h4>}
        <Button variant="ghost" size="sm" onClick={downloadCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto touch-scroll rounded-lg border border-border">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-raised border-b border-border text-text-secondary uppercase font-semibold">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 sm:px-4 sm:py-3 whitespace-nowrap ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedData.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-surface-raised/50 transition-colors">
                {columns.map((col) => {
                  const val = row[col.key];
                  const formatted = col.format ? col.format(val) : val;
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 font-mono whitespace-nowrap ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {formatted !== undefined && formatted !== null ? formatted : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-text-tertiary pt-1">
          <span>
            Page {currentPage} of {totalPages} ({data.length} total rows)
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

TableDisplay.displayName = "TableDisplay";

export default TableDisplay;

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, STATUS_COLORS } from '../lib/colors';

interface Column {
  header: string;
  width?: number;
}

interface DataTableProps {
  columns: Column[];
  rows: string[][];
  /** Column index that contains status values (auto-colored) */
  statusColumn?: number;
  appearFrame?: number;
}

/**
 * Simple table matching CLI's formatTable() from src/ui/format.ts.
 *
 * - Bold headers joined with "  " (2-space gap)
 * - Dash separator matching column widths
 * - Data rows joined with "  " (2-space gap)
 * - Status column auto-colored (lime/orange/red)
 *
 * NO Unicode borders — that's what the CLI's default list commands produce.
 */
export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  statusColumn,
  appearFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - appearFrame,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(progress, [0, 1], [8, 0], {
    extrapolateRight: 'clamp',
  });

  if (frame < appearFrame) return null;

  // Calculate column widths
  const colWidths = columns.map((col, i) => {
    const headerLen = col.header.length;
    const maxDataLen = Math.max(
      ...rows.map((r) => (r[i] ?? '').length),
      0,
    );
    return col.width ?? Math.max(headerLen, maxDataLen, 10);
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        whiteSpace: 'pre',
        color: BRAND.text,
      }}
    >
      {/* Header row — bold */}
      <div>
        {columns.map((col, i) => (
          <span key={i}>
            {i > 0 && '  '}
            <span style={{ fontWeight: 700 }}>
              {col.header.padEnd(colWidths[i])}
            </span>
          </span>
        ))}
      </div>

      {/* Dash separator */}
      <div style={{ color: BRAND.text }}>
        {colWidths.map((w, i) => (i > 0 ? '  ' : '') + '-'.repeat(w)).join('')}
      </div>

      {/* Data rows */}
      {rows.map((row, rowIdx) => (
        <div key={rowIdx}>
          {row.map((cell, colIdx) => {
            const width = colWidths[colIdx];
            const padded = cell.padEnd(width);
            const isStatus = statusColumn === colIdx;
            const statusColor =
              isStatus
                ? STATUS_COLORS[cell.toLowerCase()] ?? BRAND.text
                : BRAND.text;

            return (
              <span key={colIdx}>
                {colIdx > 0 && '  '}
                <span
                  style={{
                    color: statusColor,
                    fontWeight: isStatus ? 400 : 400,
                  }}
                >
                  {padded}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

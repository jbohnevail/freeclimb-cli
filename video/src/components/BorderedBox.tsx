import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND } from '../lib/colors';

/**
 * A text segment with optional color/bold styling.
 * Matches how the CLI builds styled text with chalk.
 */
export type Seg = { text: string; color?: string; bold?: boolean };

/** Either an array of segments (content line) or a separator marker */
export type BoxLine = Seg[] | { separator: true; title?: string };

function renderSegs(segs: Seg[]): React.ReactNode[] {
  return segs.map((s, i) => (
    <span
      key={i}
      style={{
        color: s.color ?? BRAND.text,
        fontWeight: s.bold ? 700 : 400,
      }}
    >
      {s.text}
    </span>
  ));
}

function segLength(segs: Seg[]): number {
  return segs.reduce((sum, s) => sum + s.text.length, 0);
}

interface BorderedBoxProps {
  title?: string;
  width: number;
  lines: BoxLine[];
  appearFrame?: number;
}

/**
 * Bordered box matching CLI's `borderedBox()` from src/ui/components.ts.
 *
 * - Box drawing chars render in default text color (BRAND.text) — NOT dimmed
 * - Title renders in orange bold
 * - Content lines get │ on both sides, padded to inner width
 * - Separators rendered via horizontalRule() format
 */
export const BorderedBox: React.FC<BorderedBoxProps> = ({
  title,
  width,
  lines,
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

  const innerWidth = width - 2;
  const H = '─';
  const V = '│';

  // Top border — matches sectionHeader() from CLI
  // Format: ╭─ TITLE ─────────╮
  let topBorder: React.ReactNode;
  if (title) {
    const paddedTitle = ` ${title} `;
    const remainingWidth = Math.max(0, width - paddedTitle.length - 3);
    topBorder = (
      <div style={{ whiteSpace: 'pre', color: BRAND.text }}>
        {'╭' + H}
        <span style={{ color: BRAND.orange, fontWeight: 700 }}>
          {paddedTitle}
        </span>
        {H.repeat(remainingWidth) + '╮'}
      </div>
    );
  } else {
    topBorder = (
      <div style={{ whiteSpace: 'pre', color: BRAND.text }}>
        {'╭' + H.repeat(innerWidth) + '╮'}
      </div>
    );
  }

  // Bottom border
  const bottomBorder = (
    <div style={{ whiteSpace: 'pre', color: BRAND.text }}>
      {'╰' + H.repeat(innerWidth) + '╯'}
    </div>
  );

  // Render content lines
  const contentLines = lines.map((line, idx) => {
    if (!Array.isArray(line) && 'separator' in line) {
      // Section separator — matches horizontalRule() from CLI
      // The separator is a content line wrapped by │...│ (matching CLI's borderedBox)
      const sepTitle = line.title;
      if (sepTitle) {
        const paddedSepTitle = ` ${sepTitle} `;
        const sepRemaining = Math.max(0, innerWidth - paddedSepTitle.length - 2);
        const leftW = Math.floor(sepRemaining / 2);
        const rightW = sepRemaining - leftW;
        return (
          <div key={idx} style={{ whiteSpace: 'pre', color: BRAND.text }}>
            {V + '├' + H.repeat(leftW)}
            <span style={{ color: BRAND.orange }}>{paddedSepTitle}</span>
            {H.repeat(rightW) + '┤' + V}
          </div>
        );
      }
      return (
        <div key={idx} style={{ whiteSpace: 'pre', color: BRAND.text }}>
          {V + '├' + H.repeat(innerWidth - 2) + '┤' + V}
        </div>
      );
    }

    // Content line — │{segments}{padding}│
    const segs = line as Seg[];
    const visLen = segLength(segs);
    const padding = Math.max(0, innerWidth - visLen);

    return (
      <div key={idx} style={{ whiteSpace: 'pre' }}>
        <span style={{ color: BRAND.text }}>{V}</span>
        {renderSegs(segs)}
        {padding > 0 && <span>{' '.repeat(padding)}</span>}
        <span style={{ color: BRAND.text }}>{V}</span>
      </div>
    );
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {topBorder}
      {contentLines}
      {bottomBorder}
    </div>
  );
};

// ── Segment builder helpers matching CLI formatting ──

/** Key-value line: "  Key           Value" — matches keyValue() from CLI */
export function kvSegments(
  key: string,
  value: string,
  keyWidth: number = 14,
  valueColor?: string,
  valueBold?: boolean,
): Seg[] {
  return [
    { text: '  ' },
    { text: key.padEnd(keyWidth), bold: true },
    { text: '  ' },
    { text: value, color: valueColor, bold: valueBold },
  ];
}

/** Status badge segments — matches statusBadge() from CLI */
export function statusBadgeSegs(status: string): Seg[] {
  const upper = status.toUpperCase();
  const lower = status.toLowerCase();

  switch (lower) {
    case 'active':
    case 'full':
      return [
        { text: '●', color: BRAND.lime },
        { text: ` ${upper}`, color: BRAND.lime, bold: true },
      ];
    case 'trial':
      return [{ text: upper, color: BRAND.orange, bold: true }];
    case 'pending':
      return [
        { text: '⌛', color: BRAND.orange },
        { text: ` ${upper}`, color: BRAND.orange },
      ];
    case 'failed':
    case 'suspended':
    case 'closed':
      return [
        { text: '✘', color: BRAND.red },
        { text: ` ${upper}`, color: BRAND.red, bold: true },
      ];
    default:
      return [{ text: upper }];
  }
}

/** Key-value line where the value is a status badge */
export function kvBadgeSegments(
  key: string,
  status: string,
  keyWidth: number = 14,
): Seg[] {
  return [
    { text: '  ' },
    { text: key.padEnd(keyWidth), bold: true },
    { text: '  ' },
    ...statusBadgeSegs(status),
  ];
}

/** Empty line (just spaces) */
export function emptyLineSegs(): Seg[] {
  return [{ text: '' }];
}

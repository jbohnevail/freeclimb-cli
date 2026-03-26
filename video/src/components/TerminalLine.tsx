import React from 'react';
import { BRAND } from '../lib/colors';

interface TerminalLineProps {
  children?: React.ReactNode;
  prompt?: boolean;
  dim?: boolean;
  color?: string;
  bold?: boolean;
}

export const TerminalLine: React.FC<TerminalLineProps> = ({
  children,
  prompt = false,
  dim = false,
  color,
  bold = false,
}) => {
  return (
    <div
      style={{
        color: dim ? BRAND.dimText : color ?? BRAND.text,
        fontWeight: bold ? 700 : 400,
        whiteSpace: 'pre',
        minHeight: '1.6em',
      }}
    >
      {prompt && (
        <span style={{ color: BRAND.promptGreen, fontWeight: 700 }}>$ </span>
      )}
      {children}
    </div>
  );
};

/**
 * Cursor that blinks at ~530ms intervals
 */
export const Cursor: React.FC<{ frame: number; visible?: boolean }> = ({
  frame,
  visible = true,
}) => {
  if (!visible) return null;
  const blink = Math.floor(frame / 16) % 2 === 0;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 9,
        height: '1.1em',
        backgroundColor: blink ? BRAND.text : 'transparent',
        verticalAlign: 'text-bottom',
        marginLeft: 1,
      }}
    />
  );
};

import React from 'react';
import { useCurrentFrame } from 'remotion';
import { getTypedText, isTypingComplete } from '../lib/typewriter';
import { BRAND } from '../lib/colors';
import { Cursor } from './TerminalLine';

interface TypewriterProps {
  text: string;
  startFrame: number;
  charsPerFrame?: number;
  prompt?: boolean;
  color?: string;
}

/**
 * Renders a typing animation of text, with optional $ prompt and blinking cursor.
 */
export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startFrame,
  charsPerFrame = 2,
  prompt = true,
  color,
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame) return null;

  const visibleText = getTypedText(frame, text, startFrame, charsPerFrame);
  const done = isTypingComplete(frame, text, startFrame, charsPerFrame);

  return (
    <div style={{ whiteSpace: 'pre', minHeight: '1.6em' }}>
      {prompt && (
        <span style={{ color: BRAND.promptGreen, fontWeight: 700 }}>$ </span>
      )}
      <span style={{ color: color ?? BRAND.text }}>{visibleText}</span>
      <Cursor frame={frame} visible={!done} />
    </div>
  );
};

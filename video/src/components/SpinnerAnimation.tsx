import React from 'react';
import { useCurrentFrame } from 'remotion';
import { BRAND } from '../lib/colors';

/**
 * Braille dot spinner matching CLI's createSpinner() from src/ui/spinner.ts.
 *
 * Spinning: frame char + text in default text color (no special colors)
 * Resolved: ✔/✘ (colored icon) + text in default text color
 *
 * CLI spinner.succeed(): `${icons.success()} ${msg}\n` — ✔ in lime, msg in plain
 * CLI spinner.fail():    `${icons.error()} ${msg}\n`   — ✘ in red, msg in plain
 */

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface SpinnerAnimationProps {
  text: string;
  startFrame: number;
  resolveFrame: number;
  result?: string;
  success?: boolean;
}

export const SpinnerAnimation: React.FC<SpinnerAnimationProps> = ({
  text,
  startFrame,
  resolveFrame,
  result,
  success = true,
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame) return null;

  const resolved = frame >= resolveFrame;

  if (resolved) {
    const icon = success ? '✔' : '✘';
    const iconColor = success ? BRAND.lime : BRAND.red;
    return (
      <div style={{ whiteSpace: 'pre' }}>
        <span style={{ color: iconColor }}>{icon}</span>
        <span style={{ color: BRAND.text }}> {result ?? text}</span>
      </div>
    );
  }

  // Spinning state: advance spinner ~every 2.4 frames (80ms at 30fps)
  const elapsed = frame - startFrame;
  const spinnerIndex = Math.floor(elapsed / 2.4) % SPINNER_FRAMES.length;

  return (
    <div style={{ whiteSpace: 'pre' }}>
      <span style={{ color: BRAND.text }}>{SPINNER_FRAMES[spinnerIndex]}</span>
      <span style={{ color: BRAND.text }}> {text}</span>
    </div>
  );
};

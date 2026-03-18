import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND } from '../lib/colors';
import {
  BANNER_LINES,
  BANNER_TAGLINE,
  BANNER_COMMANDS,
  BANNER_TRY_HINT,
  BANNER_LEARN_MORE_URL,
} from '../data/demo-data';

interface AsciiBannerProps {
  appearFrame: number;
}

/**
 * Renders the FREECLIMB ASCII art welcome banner matching
 * getWelcomeBanner() from src/ui/banner.ts.
 */
export const AsciiBanner: React.FC<AsciiBannerProps> = ({ appearFrame }) => {
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

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* ASCII art lines */}
      {BANNER_LINES.map((line, i) => (
        <div
          key={i}
          style={{
            whiteSpace: 'pre',
            color: BRAND.darkTeal,
            minHeight: '1.6em',
          }}
        >
          {line}
        </div>
      ))}

      {/* Tagline */}
      <div style={{ whiteSpace: 'pre', minHeight: '1.6em' }}>
        <span style={{ color: BRAND.dimText }}>
          {'  The communications CLI for '}
        </span>
        <span style={{ color: BRAND.orange }}>{BANNER_TAGLINE.word1}</span>
        <span style={{ color: BRAND.dimText }}>{' and '}</span>
        <span style={{ color: BRAND.orange }}>{BANNER_TAGLINE.word2}</span>
      </div>

      {/* Empty line */}
      <div style={{ minHeight: '1.6em' }} />

      {/* Command list */}
      {BANNER_COMMANDS.map((cmd, i) => (
        <div key={i} style={{ whiteSpace: 'pre', minHeight: '1.6em' }}>
          <span style={{ color: BRAND.lightTeal }}>{'  $ '}</span>
          <span style={{ color: BRAND.lightTeal }}>{cmd.name}</span>
          <span style={{ color: BRAND.dimText }}>
            {' '}{cmd.subcommands}
          </span>
          <span style={{ color: BRAND.dimText }}>
            {cmd.pad}{cmd.description}
          </span>
        </div>
      ))}

      {/* Empty line */}
      <div style={{ minHeight: '1.6em' }} />

      {/* Try hint */}
      <div style={{ whiteSpace: 'pre', minHeight: '1.6em' }}>
        <span style={{ color: BRAND.lime }}>{'  '}{BANNER_TRY_HINT}</span>
      </div>

      {/* Empty line */}
      <div style={{ minHeight: '1.6em' }} />

      {/* Learn more */}
      <div style={{ whiteSpace: 'pre', minHeight: '1.6em' }}>
        <span style={{ color: BRAND.orange }}>{'  Learn more'}</span>
        <span style={{ color: BRAND.dimText }}>{' at '}</span>
        <span
          style={{
            color: BRAND.text,
            textDecoration: 'underline',
          }}
        >
          {BANNER_LEARN_MORE_URL}
        </span>
      </div>
    </div>
  );
};

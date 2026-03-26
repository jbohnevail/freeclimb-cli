import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Terminal } from '../components/Terminal';
import { TerminalLine } from '../components/TerminalLine';
import { Typewriter } from '../components/Typewriter';
import { SpinnerAnimation } from '../components/SpinnerAnimation';
import {
  BorderedBox,
  type BoxLine,
  type Seg,
  emptyLineSegs,
} from '../components/BorderedBox';
import { BRAND } from '../lib/colors';
import { getTypingEndFrame } from '../lib/typewriter';
import {
  SD_DIAGNOSE_CMD,
  SD_CHECKS,
  SD_SUMMARY_WIDTH,
} from '../data/demo-data';

export const StatusDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Timeline
  const cmdStart = 30;
  const cmdEnd = getTypingEndFrame(SD_DIAGNOSE_CMD, cmdStart, 2);
  const titleFrame = cmdEnd + 15;

  const checkDuration = 60;
  const spinDuration = 45;
  const checksStart = titleFrame + 30;

  const checkFrames = SD_CHECKS.map((_, i) => ({
    start: checksStart + i * checkDuration,
    resolve: checksStart + i * checkDuration + spinDuration,
  }));

  const lastResolve = checkFrames[checkFrames.length - 1].resolve;
  const summaryFrame = lastResolve + 30;

  // Fade out
  const fadeOutStart = durationInFrames - 60;
  const opacity = interpolate(
    frame,
    [0, 15, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );

  // Summary box — borderedBox(summaryLines, "Summary", 50)
  const summaryLines: BoxLine[] = [
    emptyLineSegs(),
    [
      { text: '  ' },
      { text: '✔', color: BRAND.lime },
      { text: ' 4 passed  ' },
      { text: '✘', color: BRAND.red },
      { text: ' 0 failed  ' },
      { text: '⚠', color: BRAND.orange },
      { text: ' 0 warnings' },
    ] as Seg[],
    emptyLineSegs(),
    [
      {
        text: '  All checks passed! Your FreeClimb CLI is configured correctly.',
        color: BRAND.lime,
      },
    ] as Seg[],
    emptyLineSegs(),
  ];

  return (
    <div style={{ opacity }}>
      <Terminal>
        {/* Command */}
        <Typewriter text={SD_DIAGNOSE_CMD} startFrame={cmdStart} />

        {/* Title — chalk.hex(orange).bold + chalk.dim(dashes) */}
        {frame >= titleFrame && (
          <>
            <TerminalLine />
            <TerminalLine color={BRAND.darkTeal} bold>
              FreeClimb Diagnostics
            </TerminalLine>
            <TerminalLine dim>{'─'.repeat(40)}</TerminalLine>
            <TerminalLine />
          </>
        )}

        {/* Diagnostic checks */}
        {SD_CHECKS.map((check, i) =>
          frame >= checkFrames[i].start ? (
            <SpinnerAnimation
              key={i}
              text={`Checking ${check.name}...`}
              startFrame={checkFrames[i].start}
              resolveFrame={checkFrames[i].resolve}
              result={check.result}
              success
            />
          ) : null,
        )}

        {/* Summary box */}
        {frame >= summaryFrame && (
          <>
            <TerminalLine />
            <BorderedBox
              title="Summary"
              width={SD_SUMMARY_WIDTH}
              lines={summaryLines}
              appearFrame={summaryFrame}
            />
            <TerminalLine />
          </>
        )}
      </Terminal>
    </div>
  );
};

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Terminal } from '../components/Terminal';
import { TerminalLine } from '../components/TerminalLine';
import { Typewriter } from '../components/Typewriter';
import {
  BorderedBox,
  kvSegments,
  kvBadgeSegments,
  emptyLineSegs,
  type BoxLine,
} from '../components/BorderedBox';
import { SpinnerAnimation } from '../components/SpinnerAnimation';
import { AsciiBanner } from '../components/AsciiBanner';
import { BRAND } from '../lib/colors';
import { getTypingEndFrame } from '../lib/typewriter';
import {
  QS_INSTALL_CMD,
  QS_INSTALL_OUTPUT,
  QS_BANNER_CMD,
  QS_STATUS_CMD,
  QS_STATUS_SPINNER_TEXT,
  QS_STATUS_WIDTH,
  QS_STATUS_TITLE,
  QS_ACCOUNT_ID,
  QS_QUICK_ACTIONS,
} from '../data/demo-data';

export const QuickStart: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Timeline (frames at 30fps)
  // 0–30: blank terminal
  const installStart = 30;
  const installEnd = getTypingEndFrame(QS_INSTALL_CMD, installStart, 2);
  const installOutputStart = installEnd + 15;

  // ~75: type `freeclimb`
  const bannerCmdStart = installOutputStart + 30;
  const bannerCmdEnd = getTypingEndFrame(QS_BANNER_CMD, bannerCmdStart, 2);
  // ~95: banner appears
  const bannerAppear = bannerCmdEnd + 13;

  // ~230: type `freeclimb status` (hold banner ~4.5s)
  const statusStart = bannerAppear + 135;
  const statusEnd = getTypingEndFrame(QS_STATUS_CMD, statusStart, 2);
  const spinnerStart = statusEnd + 10;
  const spinnerResolve = spinnerStart + 45;
  const dashboardAppear = spinnerResolve + 5;
  const quickActionsAppear = dashboardAppear + 90;

  // Fade out
  const fadeOutStart = durationInFrames - 60;
  const opacity = interpolate(
    frame,
    [0, 15, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );

  // Build bordered box lines matching CLI status.ts renderStatusDashboard()
  const boxLines: BoxLine[] = [
    kvSegments('Account ID', QS_ACCOUNT_ID, 14),
    kvBadgeSegments('Type', 'trial', 14),
    kvBadgeSegments('Status', 'active', 14),
    kvSegments('Balance', '$45.32', 14, BRAND.lime),
    emptyLineSegs(),
    { separator: true, title: 'Resources' },
    emptyLineSegs(),
    kvSegments('Phone Numbers', '2 owned', 14, BRAND.lime),
    kvSegments('Applications', '3 configured', 14, BRAND.lime),
  ];

  return (
    <div style={{ opacity }}>
      <Terminal>
        {/* npm install */}
        <Typewriter text={QS_INSTALL_CMD} startFrame={installStart} />

        {frame >= installOutputStart && (
          <>
            {QS_INSTALL_OUTPUT.map((line, i) => (
              <TerminalLine key={i} dim>{line}</TerminalLine>
            ))}
            <TerminalLine />
          </>
        )}

        {/* freeclimb (triggers welcome banner) */}
        {frame >= bannerCmdStart && (
          <Typewriter text={QS_BANNER_CMD} startFrame={bannerCmdStart} />
        )}

        {/* ASCII banner */}
        <AsciiBanner appearFrame={bannerAppear} />

        {/* freeclimb status */}
        {frame >= statusStart && (
          <>
            <TerminalLine />
            <Typewriter text={QS_STATUS_CMD} startFrame={statusStart} />
          </>
        )}

        {/* Spinner — status.ts calls spinner.stop() (clears line), NOT succeed() */}
        {frame >= spinnerStart && frame < spinnerResolve && (
          <SpinnerAnimation
            text={QS_STATUS_SPINNER_TEXT}
            startFrame={spinnerStart}
            resolveFrame={spinnerResolve + 9999}
          />
        )}

        {/* Status Dashboard — borderedBox() width=55 */}
        {frame >= dashboardAppear && (
          <>
            <TerminalLine />
            <BorderedBox
              title={QS_STATUS_TITLE}
              width={QS_STATUS_WIDTH}
              lines={boxLines}
              appearFrame={dashboardAppear}
            />
          </>
        )}

        {/* Quick Actions — quickActions() from CLI, outside the box */}
        {frame >= quickActionsAppear && (
          <div
            style={{
              opacity: interpolate(
                frame - quickActionsAppear,
                [0, 15],
                [0, 1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
              ),
            }}
          >
            <TerminalLine />
            <TerminalLine dim>Quick Actions:</TerminalLine>
            {QS_QUICK_ACTIONS.map((action, i) => (
              <TerminalLine key={i}>
                <span>{'  '}</span>
                <span style={{ color: BRAND.orange }}>{action.command}</span>
                <span style={{ color: BRAND.dimText }}>
                  {'  '}{action.description}
                </span>
              </TerminalLine>
            ))}
          </div>
        )}
      </Terminal>
    </div>
  );
};

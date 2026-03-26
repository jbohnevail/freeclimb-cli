import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Terminal } from '../components/Terminal';
import { TerminalLine } from '../components/TerminalLine';
import { Typewriter } from '../components/Typewriter';
import { DataTable } from '../components/DataTable';
import { BRAND } from '../lib/colors';
import { getTypingEndFrame } from '../lib/typewriter';
import {
  AW_CALLS_CMD,
  AW_CALLS_COLUMNS,
  AW_CALLS_ROWS,
  AW_SMS_CMD,
  AW_SMS_JSON,
  AW_API_CMD,
  AW_API_STATUS,
  AW_API_JSON,
} from '../data/demo-data';

export const ApiWorkflow: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Timeline
  const callsStart = 30;
  const callsEnd = getTypingEndFrame(AW_CALLS_CMD, callsStart, 2);
  const tableAppear = callsEnd + 20;

  const smsStart = tableAppear + 120;
  const smsEnd = getTypingEndFrame(AW_SMS_CMD, smsStart, 1.5);
  const smsOutputStart = smsEnd + 15;

  const apiStart = smsOutputStart + 90;
  const apiEnd = getTypingEndFrame(AW_API_CMD, apiStart, 1.5);
  const apiOutputStart = apiEnd + 15;

  // Fade out
  const fadeOutStart = durationInFrames - 60;
  const opacity = interpolate(
    frame,
    [0, 15, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );

  return (
    <div style={{ opacity }}>
      <Terminal>
        {/* calls:list — formatTable() simple table, NO borders */}
        <Typewriter text={AW_CALLS_CMD} startFrame={callsStart} />

        {frame >= tableAppear && (
          <>
            <TerminalLine />
            <DataTable
              columns={AW_CALLS_COLUMNS}
              rows={AW_CALLS_ROWS}
              statusColumn={3}
              appearFrame={tableAppear}
            />
            <TerminalLine />
          </>
        )}

        {/* sms:send --json — wrapJsonOutput envelope */}
        {frame >= smsStart && (
          <Typewriter
            text={AW_SMS_CMD}
            startFrame={smsStart}
            charsPerFrame={1.5}
          />
        )}

        {frame >= smsOutputStart && (
          <div
            style={{
              opacity: interpolate(
                frame - smsOutputStart,
                [0, 10],
                [0, 1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
              ),
            }}
          >
            <TerminalLine />
            <PlainJson json={AW_SMS_JSON} />
            <TerminalLine />
          </div>
        )}

        {/* api /Calls — human format: "200 OK" green + plain JSON */}
        {frame >= apiStart && (
          <Typewriter
            text={AW_API_CMD}
            startFrame={apiStart}
            charsPerFrame={1.5}
          />
        )}

        {frame >= apiOutputStart && (
          <div
            style={{
              opacity: interpolate(
                frame - apiOutputStart,
                [0, 10],
                [0, 1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
              ),
            }}
          >
            <TerminalLine color="#27c93f">{AW_API_STATUS}</TerminalLine>
            <TerminalLine />
            <PlainJson json={AW_API_JSON} />
          </div>
        )}
      </Terminal>
    </div>
  );
};

/** Plain JSON — CLI outputs JSON.stringify(data, null, 2) with no highlighting */
const PlainJson: React.FC<{ json: string }> = ({ json }) => {
  const lines = json.split('\n');
  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} style={{ whiteSpace: 'pre', color: BRAND.text }}>
          {line}
        </div>
      ))}
    </div>
  );
};

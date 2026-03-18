import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Terminal } from '../components/Terminal';
import { TerminalLine } from '../components/TerminalLine';
import { Typewriter } from '../components/Typewriter';
import { BRAND } from '../lib/colors';
import { getTypingEndFrame } from '../lib/typewriter';
import {
  AI_MCP_CMD,
  AI_AGENT_CONNECT,
  AI_TOOL_CALL_1,
  AI_TOOL_RESPONSE_1,
  AI_TOOL_CALL_2,
  AI_TOOL_RESPONSE_2,
} from '../data/demo-data';

const ProtocolJson: React.FC<{
  json: string;
  frame: number;
  appearFrame: number;
  direction: 'in' | 'out';
}> = ({ json, frame, appearFrame, direction }) => {
  if (frame < appearFrame) return null;
  const opacity = interpolate(frame - appearFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const color = direction === 'in' ? BRAND.dimText : BRAND.text;
  const lines = json.split('\n');

  return (
    <div style={{ opacity }}>
      {lines.map((line, i) => (
        <div key={i} style={{ whiteSpace: 'pre', color, fontSize: 14 }}>
          {line}
        </div>
      ))}
    </div>
  );
};

export const AgentIntegration: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Timeline
  const cmdStart = 30;
  const cmdEnd = getTypingEndFrame(AI_MCP_CMD, cmdStart, 2);
  const serverStartFrame = cmdEnd + 15;
  const connectFrame = serverStartFrame + 45;
  const toolCall1Frame = connectFrame + 45;
  const toolResponse1Frame = toolCall1Frame + 30;
  const toolCall2Frame = toolResponse1Frame + 90;
  const toolResponse2Frame = toolCall2Frame + 30;

  // Fade out
  const fadeOutStart = durationInFrames - 45;
  const opacity = interpolate(
    frame,
    [0, 15, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  );

  return (
    <div style={{ opacity }}>
      <Terminal title="freeclimb — mcp protocol">
        {/* mcp:start command */}
        <Typewriter text={AI_MCP_CMD} startFrame={cmdStart} />

        {/* Server started — MCP-tagged stderr in cyan */}
        {frame >= serverStartFrame && (
          <>
            <TerminalLine />
            <TerminalLine color={BRAND.cyan}>
              MCP server listening on stdio
            </TerminalLine>
          </>
        )}

        {/* Agent connection */}
        {frame >= connectFrame && (
          <>
            <TerminalLine />
            <TerminalLine dim>{AI_AGENT_CONNECT}</TerminalLine>
          </>
        )}

        {/* Tool call 1 — agent sends JSON-RPC (stdin) */}
        {frame >= toolCall1Frame && (
          <>
            <TerminalLine />
            <TerminalLine dim>{'→ stdin'}</TerminalLine>
            <ProtocolJson
              json={AI_TOOL_CALL_1}
              frame={frame}
              appearFrame={toolCall1Frame}
              direction="in"
            />
          </>
        )}

        {/* Tool response 1 — server sends JSON-RPC (stdout) */}
        {frame >= toolResponse1Frame && (
          <>
            <TerminalLine dim>{'← stdout'}</TerminalLine>
            <ProtocolJson
              json={AI_TOOL_RESPONSE_1}
              frame={frame}
              appearFrame={toolResponse1Frame}
              direction="out"
            />
          </>
        )}

        {/* Tool call 2 */}
        {frame >= toolCall2Frame && (
          <>
            <TerminalLine />
            <TerminalLine dim>{'→ stdin'}</TerminalLine>
            <ProtocolJson
              json={AI_TOOL_CALL_2}
              frame={frame}
              appearFrame={toolCall2Frame}
              direction="in"
            />
          </>
        )}

        {/* Tool response 2 */}
        {frame >= toolResponse2Frame && (
          <>
            <TerminalLine dim>{'← stdout'}</TerminalLine>
            <ProtocolJson
              json={AI_TOOL_RESPONSE_2}
              frame={frame}
              appearFrame={toolResponse2Frame}
              direction="out"
            />
          </>
        )}
      </Terminal>
    </div>
  );
};

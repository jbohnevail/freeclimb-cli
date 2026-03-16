import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { getTypedText, isTypingComplete, getTypingEndFrame } from "../lib/typewriter";
import { COMMAND_1, OUTPUT_1, COMMAND_2, OUTPUT_2, TIMELINE } from "../data/commands";

const COLORS = {
  background: "#1a1a1a",
  titleBar: "#323232",
  titleBarBorder: "#1a1a1a",
  terminalBg: "#0d0d0d",
  text: "#e0e0e0",
  prompt: "#27c93f",
  cursor: "#ffffff",
  trafficRed: "#ff5f56",
  trafficYellow: "#ffbd2e",
  trafficGreen: "#27c93f",
  cyan: "#00d4ff",
  dimText: "#808080",
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: COLORS.background,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  window: {
    width: 1200,
    height: 920,
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6)",
    display: "flex",
    flexDirection: "column",
  },
  titleBar: {
    backgroundColor: COLORS.titleBar,
    height: 40,
    display: "flex",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 16,
    borderBottom: `1px solid ${COLORS.titleBarBorder}`,
  },
  trafficLights: {
    display: "flex",
    gap: 8,
  },
  trafficLight: {
    width: 14,
    height: 14,
    borderRadius: "50%",
  },
  titleText: {
    flex: 1,
    textAlign: "center" as const,
    color: "#8e8e8e",
    fontSize: 14,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    fontWeight: 500,
    marginRight: 70,
  },
  terminalBody: {
    flex: 1,
    backgroundColor: COLORS.terminalBg,
    padding: 20,
    fontFamily:
      '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace',
    fontSize: 16,
    lineHeight: 1.5,
    color: COLORS.text,
    overflow: "hidden",
  },
  promptLine: {
    display: "flex",
    alignItems: "center",
    minHeight: 24,
  },
  promptSymbol: {
    color: COLORS.prompt,
    marginRight: 8,
  },
  cursor: {
    width: 10,
    height: 20,
    backgroundColor: COLORS.cursor,
    display: "inline-block",
    verticalAlign: "middle",
  },
  outputLine: {
    minHeight: 24,
    whiteSpace: "pre",
  },
};

/**
 * Render a single output line with syntax highlighting
 */
const OutputLine: React.FC<{ line: string }> = ({ line }) => {
  // Highlight $ prompts in example commands
  if (line.trim().startsWith("$ freeclimb")) {
    const parts = line.split(/(\$ freeclimb)/);
    return (
      <div style={styles.outputLine}>
        {parts.map((part, i) =>
          part === "$ freeclimb" ? (
            <span key={i}>
              <span style={{ color: COLORS.prompt }}>$</span>
              <span> freeclimb</span>
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  }

  // Highlight URLs
  if (line.includes("https://")) {
    const parts = line.split(/(https:\/\/[^\s]+)/);
    return (
      <div style={styles.outputLine}>
        {parts.map((part, i) =>
          part.startsWith("https://") ? (
            <span key={i} style={{ color: COLORS.cyan }}>
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  }

  // Highlight "try:" hint
  if (line.includes("try:")) {
    const parts = line.split(/(try:)/);
    return (
      <div style={styles.outputLine}>
        {parts.map((part, i) =>
          part === "try:" ? (
            <span key={i} style={{ color: COLORS.dimText }}>
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  }

  return <div style={styles.outputLine}>{line}</div>;
};

/**
 * Blinking cursor component
 */
const Cursor: React.FC<{ frame: number; visible: boolean }> = ({ frame, visible }) => {
  if (!visible) return null;
  // Blink every 15 frames (0.5s at 30fps)
  const opacity = Math.floor(frame / 15) % 2 === 0 ? 1 : 0;
  return <span style={{ ...styles.cursor, opacity }} />;
};

export const TerminalWindow: React.FC = () => {
  const frame = useCurrentFrame();

  // Calculate timeline phases
  const command1End = getTypingEndFrame(COMMAND_1, TIMELINE.COMMAND_1_START, TIMELINE.CHARS_PER_FRAME);
  const output1Start = command1End + TIMELINE.OUTPUT_1_DELAY;
  const command2Start = output1Start + TIMELINE.COMMAND_2_DELAY;
  const command2End = getTypingEndFrame(COMMAND_2, command2Start, TIMELINE.CHARS_PER_FRAME);
  const output2Start = command2End + TIMELINE.OUTPUT_2_DELAY;

  // Get typed text for commands
  const typedCommand1 = getTypedText(frame, COMMAND_1, TIMELINE.COMMAND_1_START, TIMELINE.CHARS_PER_FRAME);
  const command1Complete = isTypingComplete(frame, COMMAND_1, TIMELINE.COMMAND_1_START, TIMELINE.CHARS_PER_FRAME);

  const typedCommand2 = getTypedText(frame, COMMAND_2, command2Start, TIMELINE.CHARS_PER_FRAME);
  const command2Complete = isTypingComplete(frame, COMMAND_2, command2Start, TIMELINE.CHARS_PER_FRAME);

  // Determine visibility states
  const showOutput1 = frame >= output1Start;
  const showCommand2 = frame >= command2Start;
  const showOutput2 = frame >= output2Start;

  // Cursor visibility: show at end of active typing line
  const cursorAtCommand1 = frame >= TIMELINE.COMMAND_1_START && !showCommand2;
  const cursorAtCommand2 = showCommand2 && !showOutput2;

  return (
    <AbsoluteFill style={styles.container}>
      <div style={styles.window}>
        {/* Title Bar */}
        <div style={styles.titleBar}>
          <div style={styles.trafficLights}>
            <div
              style={{
                ...styles.trafficLight,
                backgroundColor: COLORS.trafficRed,
              }}
            />
            <div
              style={{
                ...styles.trafficLight,
                backgroundColor: COLORS.trafficYellow,
              }}
            />
            <div
              style={{
                ...styles.trafficLight,
                backgroundColor: COLORS.trafficGreen,
              }}
            />
          </div>
          <div style={styles.titleText}>freeclimb-cli — zsh</div>
        </div>

        {/* Terminal Body */}
        <div style={styles.terminalBody}>
          {/* Command 1: npm install */}
          <div style={styles.promptLine}>
            <span style={styles.promptSymbol}>$</span>
            <span>{typedCommand1}</span>
            <Cursor frame={frame} visible={cursorAtCommand1 && !command1Complete} />
          </div>

          {/* Output 1: install result */}
          {showOutput1 &&
            OUTPUT_1.map((line, i) => <OutputLine key={`o1-${i}`} line={line} />)}

          {/* Command 2: freeclimb help */}
          {showCommand2 && (
            <div style={styles.promptLine}>
              <span style={styles.promptSymbol}>$</span>
              <span>{typedCommand2}</span>
              <Cursor frame={frame} visible={cursorAtCommand2 && !command2Complete} />
            </div>
          )}

          {/* Output 2: help output with ASCII art */}
          {showOutput2 &&
            OUTPUT_2.map((line, i) => <OutputLine key={`o2-${i}`} line={line} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

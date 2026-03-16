/**
 * Typewriter animation utilities for Remotion
 */

/**
 * Get the substring of text that should be visible at the current frame
 * @param frame - Current frame number
 * @param text - Full text to type
 * @param startFrame - Frame when typing begins
 * @param charsPerFrame - Characters to reveal per frame (default: 2)
 * @returns The visible portion of text
 */
export function getTypedText(
  frame: number,
  text: string,
  startFrame: number,
  charsPerFrame: number = 2
): string {
  if (frame < startFrame) return "";
  const elapsed = frame - startFrame;
  const charCount = Math.min(Math.floor(elapsed * charsPerFrame), text.length);
  return text.slice(0, charCount);
}

/**
 * Check if typing animation is complete
 */
export function isTypingComplete(
  frame: number,
  text: string,
  startFrame: number,
  charsPerFrame: number = 2
): boolean {
  if (frame < startFrame) return false;
  const elapsed = frame - startFrame;
  const charCount = Math.floor(elapsed * charsPerFrame);
  return charCount >= text.length;
}

/**
 * Get the frame when typing will complete
 */
export function getTypingEndFrame(
  text: string,
  startFrame: number,
  charsPerFrame: number = 2
): number {
  return startFrame + Math.ceil(text.length / charsPerFrame);
}

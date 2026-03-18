/**
 * Typewriter animation utilities for Remotion
 */
import { useCurrentFrame } from "remotion"

export function getTypedText(
    frame: number,
    text: string,
    startFrame: number,
    charsPerFrame: number = 2,
): string {
    if (frame < startFrame) return ""
    const elapsed = frame - startFrame
    const charCount = Math.min(Math.floor(elapsed * charsPerFrame), text.length)
    return text.slice(0, charCount)
}

export function isTypingComplete(
    frame: number,
    text: string,
    startFrame: number,
    charsPerFrame: number = 2,
): boolean {
    if (frame < startFrame) return false
    const elapsed = frame - startFrame
    return Math.floor(elapsed * charsPerFrame) >= text.length
}

export function getTypingEndFrame(
    text: string,
    startFrame: number,
    charsPerFrame: number = 2,
): number {
    return startFrame + Math.ceil(text.length / charsPerFrame)
}

/**
 * React hook for typewriter animation within Remotion
 */
export function useTypewriter(text: string, startFrame: number, charsPerFrame: number = 2) {
    const frame = useCurrentFrame()
    return {
        text: getTypedText(frame, text, startFrame, charsPerFrame),
        isComplete: isTypingComplete(frame, text, startFrame, charsPerFrame),
        endFrame: getTypingEndFrame(text, startFrame, charsPerFrame),
    }
}

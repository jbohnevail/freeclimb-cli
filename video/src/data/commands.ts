/**
 * Terminal commands and outputs for the demo animation
 */

export const COMMAND_1 = "npm install -g freeclimb-cli";

export const OUTPUT_1 = ["", "added 142 packages in 3.2s", ""];

export const COMMAND_2 = "freeclimb help";

export const OUTPUT_2 = [
  "",
  " ███████╗██████╗ ███████╗███████╗ ██████╗██╗     ██╗███╗   ███╗██████╗ ",
  " ██╔════╝██╔══██╗██╔════╝██╔════╝██╔════╝██║     ██║████╗ ████║██╔══██╗",
  " █████╗  ██████╔╝█████╗  █████╗  ██║     ██║     ██║██╔████╔██║██████╔╝",
  " ██╔══╝  ██╔══██╗██╔══╝  ██╔══╝  ██║     ██║     ██║██║╚██╔╝██║██╔══██╗",
  " ██║     ██║  ██║███████╗███████╗╚██████╗███████╗██║██║ ╚═╝ ██║██████╔╝",
  " ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝╚══════╝╚═╝╚═╝     ╚═╝╚═════╝ ",
  "",
  "  The communications CLI for developers and agents",
  "",
  "  $ freeclimb calls make | list | get      Make and manage calls",
  "  $ freeclimb sms send | list | get        Send and manage SMS",
  "  $ freeclimb applications list | create   Manage applications",
  "  $ freeclimb incoming-numbers buy | list  Manage phone numbers",
  "  $ freeclimb logs list | filter           View account logs",
  "  $ freeclimb mcp start | config           AI agent integration",
  "  $ freeclimb api <endpoint>               Authenticated API request",
  "",
  "  try: freeclimb calls:list --json",
  "",
  "  Learn more at https://docs.freeclimb.com/docs/freeclimb-cli-quickstart",
];

/**
 * Animation timeline configuration (at 30fps)
 */
export const TIMELINE = {
  // Phase 1: Initial pause with blinking cursor
  INITIAL_PAUSE_START: 0,
  INITIAL_PAUSE_END: 30,

  // Phase 2: Type npm install command
  COMMAND_1_START: 30,
  // End calculated: ~45 frames for 30 chars at 2 chars/frame = frame 75

  // Phase 3: Pause then show install output
  OUTPUT_1_DELAY: 30, // frames after command finishes

  // Phase 4: Pause before next command
  COMMAND_2_DELAY: 45, // frames after output shows

  // Phase 5: Type freeclimb help
  // Calculated dynamically

  // Phase 6: Show help output
  OUTPUT_2_DELAY: 20, // frames after command finishes

  // Characters per frame for typing speed
  CHARS_PER_FRAME: 2,
} as const;

---
description: VHS tape file authoring for CLI demo recordings
---

# VHS Tape Files

[VHS](https://github.com/charmbracelet/vhs) records terminal sessions into GIFs/MP4s/WebMs from `.tape` scripts. Run with `vhs demo.tape`.

## Critical Syntax Rules

### Type command and inline directives

`Type`, `Sleep`, `Enter` are **separate directives on the same line**, delimited by the closing `"` of the `Type` string. The most common bug is forgetting to close the `Type` string, which causes `Sleep`/`Enter` to be typed literally into the terminal.

```
# CORRECT — closing " before Sleep
Type "echo hello" Sleep 300ms Enter

# WRONG — Sleep and Enter are typed as literal text
Type "echo hello Sleep 300ms Enter
```

### Type with @speed override

Override typing speed per-command with `@<time>` immediately after `Type` (no space):

```
Type@80ms '{"pageSize": 2}' Sleep 100ms
```

### Quoting

- Double quotes `"..."` are the standard Type delimiter
- Single quotes `'...'` work and are useful when typed content contains double quotes (e.g. JSON)
- When building shell commands with nested quotes, split across multiple `Type` lines

## Settings (top of file only)

Settings must appear before any non-setting command (except `Output`). `TypingSpeed` is the only setting that can be changed mid-tape.

```
Output demo.gif

Set Shell "bash"
Set FontSize 14
Set Width 1200
Set Height 600
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set WindowBarSize 40
Set TypingSpeed 40ms
Set Padding 20
```

## Common Commands

| Command         | Example                   | Notes                    |
| --------------- | ------------------------- | ------------------------ |
| `Output`        | `Output demo.gif`         | `.gif`, `.mp4`, `.webm`  |
| `Type`          | `Type "ls -la"`           | Type characters          |
| `Type@<time>`   | `Type@80ms "slow"`        | Override typing speed    |
| `Sleep`         | `Sleep 2s`, `Sleep 300ms` | Pause recording          |
| `Enter`         | `Enter`                   | Press enter              |
| `Hide` / `Show` | `Hide` ... `Show`         | Hide setup commands      |
| `Ctrl+<key>`    | `Ctrl+C`                  | Key combos               |
| `Wait`          | `Wait /pattern/`          | Wait for regex on screen |
| `Screenshot`    | `Screenshot out.png`      | Capture frame            |
| `Env`           | `Env FOO "bar"`           | Set env var              |
| `Source`        | `Source other.tape`       | Include another tape     |
| `Require`       | `Require jq`              | Assert program exists    |

## Hide/Show for Setup

Use `Hide`/`Show` to run setup commands without recording them:

```
Hide
Type "export PATH=$PWD/bin:$PATH" Enter
Type "clear" Enter
Sleep 2s
Show
```

## Project Convention

- Tape files live in `demos/*.tape`
- Output goes to `demos/out/` (gitignored)
- Use `Set Theme "Catppuccin Mocha"` for consistent branding
- Use `Require freeclimb` to assert the CLI is available
- Name tapes to match the demo topic: `quickstart.tape`, `api-workflow.tape`, etc.

## Checklist

1. Every `Type` string must be closed before `Sleep`/`Enter` on the same line
2. Sleep durations after commands should be long enough for output to render
3. Settings go at the top — only `TypingSpeed` can appear later
4. Test locally with `vhs <file>.tape` before committing

# Agents

## Cursor Cloud specific instructions

### Overview

FreeClimb CLI (`freeclimb-cli`) is an oclif-based CLI tool for the FreeClimb cloud communications platform. It is a single-package TypeScript project (not a monorepo).

### Running the CLI locally

Use `./bin/run` from the repo root to run the CLI in development mode (instead of installing globally). Commands are documented in `docs/` and via `./bin/run --help`.

### Key commands

| Task | Command |
| ------------ | --------------------------------------------------- |
| Install deps | `npm install` |
| Build | `npx tsc -b` |
| Lint | `npx eslint src/ --ext .ts --config .eslintrc.json` |
| Test | `npm test` |
| Run CLI | `./bin/run [COMMAND]` |

### gnome-keyring setup (required for tests and CLI)

The `@napi-rs/keyring` native module requires a running gnome-keyring daemon. Before running tests or the CLI, you must start dbus and gnome-keyring:

```bash
eval "$(dbus-launch --sh-syntax)"
eval "$(echo "" | gnome-keyring-daemon -r -d --unlock 2>/dev/null)"
```

Without this, any command that touches the OS keychain (login/logout, and most tests) will fail or hang.

### Node version

The project requires Node.js 18+ (`.nvmrc` says `18.20.0`). Use `nvm use 22` or any Node 18+ version.

### Known lint issues

The repo has 4 pre-existing lint warnings (`no-await-in-loop` in logs filter/list commands). These are not introduced by agent changes.

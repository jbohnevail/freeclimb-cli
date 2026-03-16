# Agents

## Cursor Cloud specific instructions

### Overview

FreeClimb CLI (`freeclimb-cli`) is an oclif-based CLI tool for the FreeClimb cloud communications platform. It is a single-package TypeScript project (not a monorepo).

### Running the CLI locally

Use `./bin/run` from the repo root to run the CLI in development mode (instead of installing globally). Commands are documented in `docs/` and via `./bin/run --help`.

### Key commands

| Task         | Command                                             |
| ------------ | --------------------------------------------------- |
| Install deps | `yarn install --frozen-lockfile --production=false` |
| Build        | `npx tsc -b`                                        |
| Lint         | `yarn lint`                                         |
| Test         | `yarn test`                                         |
| Run CLI      | `./bin/run [COMMAND]`                               |

### gnome-keyring setup (required for tests and CLI)

The `keytar` native module requires a running gnome-keyring daemon. Before running tests or the CLI, you must start dbus and gnome-keyring:

```bash
export $(dbus-launch)
echo "" | gnome-keyring-daemon --unlock
export $(echo "" | /usr/bin/gnome-keyring-daemon -r -d --unlock)
```

Without this, any command that touches the OS keychain (login/logout, and most tests) will fail.

### Node version

The project requires Node.js 14.x (`.nvmrc` says `14.15.0`, but 14.17+ is needed for the eslint plugins). Use `nvm use 14` to activate.

### Known lint issues

The repo has 1 pre-existing lint error in `src/error-messages.ts` (extra blank line) and ~275 warnings. These are not introduced by agent changes.

### `.npmrc` caveat

The `.npmrc` references an internal `@vail` registry that is unreachable externally. This does not affect `yarn install` since no `@vail`-scoped packages are in the dependency tree.

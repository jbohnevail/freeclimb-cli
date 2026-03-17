`freeclimb accounts`
====================

You get a FreeClimb Account at signup. This includes an account ID and an API key. These two properties enable you to connect and communicate with FreeClimb.

* [`freeclimb accounts:get`](#freeclimb-accountsget)
* [`freeclimb accounts:manage`](#freeclimb-accountsmanage)

## `freeclimb accounts:get`

Retrieve a representation of the specified Account.

```
USAGE
  $ freeclimb accounts:get [--json] [--fields <value>] [-h]

FLAGS
  -h, --help            Show CLI help.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a representation of the specified Account.
```

_See code: [src/commands/accounts/get.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/accounts/get.ts)_

## `freeclimb accounts:manage`

This command allows you to manage an account.

```
USAGE
  $ freeclimb accounts:manage [-a <value>] [-l <value>] [--json] [--fields <value>] [--dry-run] [-h]

FLAGS
  -a, --alias=<value>   Description for this account.
  -h, --help            Show CLI help.
  -l, --label=<value>   Group to which this account belongs.
      --dry-run         Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  This command allows you to manage an account.
```

_See code: [src/commands/accounts/manage.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/accounts/manage.ts)_

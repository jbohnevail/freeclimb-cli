`freeclimb queue-members`
=========================

A Queue Member is a subresource of a Queue resource and represents a Call currently in a particular Queue.

* [`freeclimb queue-members:dequeue [QUEUEID] [CALLID]`](#freeclimb-queue-membersdequeue-queueid-callid)
* [`freeclimb queue-members:dequeue-head [QUEUEID]`](#freeclimb-queue-membersdequeue-head-queueid)
* [`freeclimb queue-members:get [QUEUEID] [CALLID]`](#freeclimb-queue-membersget-queueid-callid)
* [`freeclimb queue-members:get-head [QUEUEID]`](#freeclimb-queue-membersget-head-queueid)
* [`freeclimb queue-members:list [QUEUEID]`](#freeclimb-queue-memberslist-queueid)

## `freeclimb queue-members:dequeue [QUEUEID] [CALLID]`

Dequeue the specified Member. The Member's Call will begin executing the PerCL script returned from the callback specified in the actionUrl parameter when the Member was added.

```
USAGE
  $ freeclimb queue-members:dequeue [QUEUEID] [CALLID] [--json] [--fields <value>] [--dry-run] [-h]

ARGUMENTS
  [QUEUEID]  String that uniquely identifies the Queue that the Member belongs to.
  [CALLID]   ID if the Call that the Member belongs to.

FLAGS
  -h, --help            Show CLI help.
      --dry-run         Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Dequeue the specified Member. The Member's Call will begin executing the PerCL script returned from the callback
  specified in the actionUrl parameter when the Member was added.
```

_See code: [src/commands/queue-members/dequeue.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/queue-members/dequeue.ts)_

## `freeclimb queue-members:dequeue-head [QUEUEID]`

Dequeue the Member at the head of the Queue. The Member's Call will begin executing the PerCL script returned from the callback specified in the actionUrl parameter when the Member was added.

```
USAGE
  $ freeclimb queue-members:dequeue-head [QUEUEID] [--json] [--fields <value>] [--dry-run] [-h]

ARGUMENTS
  [QUEUEID]  String that uniquely identifies this queue resource.

FLAGS
  -h, --help            Show CLI help.
      --dry-run         Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Dequeue the Member at the head of the Queue. The Member's Call will begin executing the PerCL script returned from the
  callback specified in the actionUrl parameter when the Member was added.
```

_See code: [src/commands/queue-members/dequeue-head.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/queue-members/dequeue-head.ts)_

## `freeclimb queue-members:get [QUEUEID] [CALLID]`

Retrieve a representation of the specified Queue Member.

```
USAGE
  $ freeclimb queue-members:get [QUEUEID] [CALLID] [--json] [--fields <value>] [-h]

ARGUMENTS
  [QUEUEID]  String that uniquely identifies the Queue that the Member belongs to.
  [CALLID]   ID of the Call that the Member belongs to.

FLAGS
  -h, --help            Show CLI help.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a representation of the specified Queue Member.
```

_See code: [src/commands/queue-members/get.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/queue-members/get.ts)_

## `freeclimb queue-members:get-head [QUEUEID]`

Retrieve a representation of the Queue Member currently at the head of the Queue.

```
USAGE
  $ freeclimb queue-members:get-head [QUEUEID] [--json] [--fields <value>] [-h]

ARGUMENTS
  [QUEUEID]  String that uniquely identifies the Queue that the Member belongs to.

FLAGS
  -h, --help            Show CLI help.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a representation of the Queue Member currently at the head of the Queue.
```

_See code: [src/commands/queue-members/get-head.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/queue-members/get-head.ts)_

## `freeclimb queue-members:list [QUEUEID]`

Retrieve a list of Members in the specified Queue.

```
USAGE
  $ freeclimb queue-members:list [QUEUEID] [-n] [--json] [--fields <value>] [-h]

ARGUMENTS
  [QUEUEID]  String that uniquely identifies the Queue that the Member belongs to.

FLAGS
  -h, --help            Show CLI help.
  -n, --next            Displays the next page of output.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a list of Members in the specified Queue.
```

_See code: [src/commands/queue-members/list.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/queue-members/list.ts)_

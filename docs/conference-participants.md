`freeclimb conference-participants`
===================================

A Participant is a subresource of a Conference resource and represents a Call currently connected to a particular Conference.

* [`freeclimb conference-participants:get [CONFERENCEID] [CALLID]`](#freeclimb-conference-participantsget-conferenceid-callid)
* [`freeclimb conference-participants:list [CONFERENCEID]`](#freeclimb-conference-participantslist-conferenceid)
* [`freeclimb conference-participants:remove [CONFERENCEID] [CALLID]`](#freeclimb-conference-participantsremove-conferenceid-callid)
* [`freeclimb conference-participants:update [CONFERENCEID] [CALLID]`](#freeclimb-conference-participantsupdate-conferenceid-callid)

## `freeclimb conference-participants:get [CONFERENCEID] [CALLID]`

Retrieve a representation of the specified Conference Participant.

```
USAGE
  $ freeclimb conference-participants:get [CONFERENCEID] [CALLID] [--json] [--fields <value>] [-h]

ARGUMENTS
  [CONFERENCEID]  ID of the conference this participant is in.
  [CALLID]        ID of the Call associated with this participant.

FLAGS
  -h, --help            Show CLI help.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a representation of the specified Conference Participant.
```

_See code: [src/commands/conference-participants/get.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/conference-participants/get.ts)_

## `freeclimb conference-participants:list [CONFERENCEID]`

Retrieve a list of Participants in the specified Conference, sorted by date created, newest to oldest.

```
USAGE
  $ freeclimb conference-participants:list [CONFERENCEID] [-L true|false] [-l true|false] [-n] [--json] [--fields
  <value>] [-h]

ARGUMENTS
  [CONFERENCEID]  ID of the conference this participant is in.

FLAGS
  -L, --talk=<option>    Only show Participants with the talk privilege.
                         <options: true|false>
  -h, --help             Show CLI help.
  -l, --listen=<option>  Only show Participants with the listen privilege.
                         <options: true|false>
  -n, --next             Displays the next page of output.
      --fields=<value>   Comma-separated list of fields to include in the response. Limits output to protect context
                         windows when used by agents.
      --json             Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a list of Participants in the specified Conference, sorted by date created, newest to oldest.
```

_See code: [src/commands/conference-participants/list.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/conference-participants/list.ts)_

## `freeclimb conference-participants:remove [CONFERENCEID] [CALLID]`

Remove the specified Participant from the Conference.

```
USAGE
  $ freeclimb conference-participants:remove [CONFERENCEID] [CALLID] [--json] [--fields <value>] [--dry-run] [-h]

ARGUMENTS
  [CONFERENCEID]  ID of the conference this participant is in.
  [CALLID]        ID of the Call associated with this participant.

FLAGS
  -h, --help            Show CLI help.
      --dry-run         Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Remove the specified Participant from the Conference.
```

_See code: [src/commands/conference-participants/remove.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/conference-participants/remove.ts)_

## `freeclimb conference-participants:update [CONFERENCEID] [CALLID]`

Update the properties of the specified conference participant.

```
USAGE
  $ freeclimb conference-participants:update [CONFERENCEID] [CALLID] [-L true|false] [-l true|false] [--json] [--fields <value>]
    [--dry-run] [-h]

ARGUMENTS
  [CONFERENCEID]  ID of the conference this participant is in.
  [CALLID]        ID of the Call associated with this participant.

FLAGS
  -L, --talk=<option>    (Optional) Default is true. Setting to false mutes the Participant. FreeClimb returns an error
                         and ignores any other value.
                         <options: true|false>
  -h, --help             Show CLI help.
  -l, --listen=<option>  (Optional) Default is true. Setting to false silences the Conference for this Participant.
                         FreeClimb returns an error and ignores any other value.
                         <options: true|false>
      --dry-run          Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>   Comma-separated list of fields to include in the response. Limits output to protect context
                         windows when used by agents.
      --json             Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Update the properties of the specified conference participant.
```

_See code: [src/commands/conference-participants/update.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/conference-participants/update.ts)_

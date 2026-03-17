`freeclimb incoming-numbers`
============================

This is the collection of all the phone numbers that you have purchased from FreeClimb and which now belong to the account. These phone numbers can receive and send calls.

* [`freeclimb incoming-numbers:buy [PHONENUMBER]`](#freeclimb-incoming-numbersbuy-phonenumber)
* [`freeclimb incoming-numbers:delete [PHONENUMBERID]`](#freeclimb-incoming-numbersdelete-phonenumberid)
* [`freeclimb incoming-numbers:get [PHONENUMBERID]`](#freeclimb-incoming-numbersget-phonenumberid)
* [`freeclimb incoming-numbers:list`](#freeclimb-incoming-numberslist)
* [`freeclimb incoming-numbers:update [PHONENUMBERID]`](#freeclimb-incoming-numbersupdate-phonenumberid)

## `freeclimb incoming-numbers:buy [PHONENUMBER]`

Purchase a new phone number for the specified account. If the specified phone number is available, FreeClimb will add it to the account. To find an available phone number, use the /AvailablePhoneNumbers endpoint.

```
USAGE
  $ freeclimb incoming-numbers:buy [PHONENUMBER] [-a <value>] [-A <value>] [--json] [--fields <value>] [--dry-run] [-h]

ARGUMENTS
  [PHONENUMBER]  Phone number to purchase in E.164 format (as returned in the list of Available Phone Numbers).

FLAGS
  -A, --applicationId=<value>  ID of the application that should handle phone calls to the number.
  -a, --alias=<value>          Description for this new incoming phone number (max 64 characters).
  -h, --help                   Show CLI help.
      --dry-run                Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>         Comma-separated list of fields to include in the response. Limits output to protect
                               context windows when used by agents.
      --json                   Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Purchase a new phone number for the specified account. If the specified phone number is available, FreeClimb will add
  it to the account. To find an available phone number, use the /AvailablePhoneNumbers endpoint.
```

_See code: [src/commands/incoming-numbers/buy.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/incoming-numbers/buy.ts)_

## `freeclimb incoming-numbers:delete [PHONENUMBERID]`

Delete the specified incoming number. FreeClimb will no longer answer calls to the number.

```
USAGE
  $ freeclimb incoming-numbers:delete [PHONENUMBERID] [--json] [--fields <value>] [--dry-run] [-h]

ARGUMENTS
  [PHONENUMBERID]  String that uniquely identifies this phone number resource.

FLAGS
  -h, --help            Show CLI help.
      --dry-run         Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Delete the specified incoming number. FreeClimb will no longer answer calls to the number.
```

_See code: [src/commands/incoming-numbers/delete.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/incoming-numbers/delete.ts)_

## `freeclimb incoming-numbers:get [PHONENUMBERID]`

Retrieve a representation of the specified incoming phone number.

```
USAGE
  $ freeclimb incoming-numbers:get [PHONENUMBERID] [--json] [--fields <value>] [-h]

ARGUMENTS
  [PHONENUMBERID]  String that uniquely identifies this phone number resource.

FLAGS
  -h, --help            Show CLI help.
      --fields=<value>  Comma-separated list of fields to include in the response. Limits output to protect context
                        windows when used by agents.
      --json            Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a representation of the specified incoming phone number.
```

_See code: [src/commands/incoming-numbers/get.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/incoming-numbers/get.ts)_

## `freeclimb incoming-numbers:list`

Retrieve a list of Incoming Phone Numbers associated with the specified account, sorted from newest to oldest.

```
USAGE
  $ freeclimb incoming-numbers:list [-p <value>] [-a <value>] [-A <value>] [-h true|false] [-C <value>] [-r <value>] [-E
    true|false] [-o true|false] [-n] [--json] [--fields <value>] [-h]

FLAGS
  -A, --applicationId=<value>    Filters numbers by application ID.
  -C, --country=<value>          Filters numbers by two character ISO country code.
  -E, --smsEnabled=<option>      Filters numbers based on SMS capability.
                                 <options: true|false>
  -a, --alias=<value>            Only show incoming phone numbers with aliases that exactly match this value.
  -h, --hasApplication=<option>  Filters numbers by whether or not they are associated with an application.
                                 <options: true|false>
  -h, --help                     Show CLI help.
  -n, --next                     Displays the next page of output.
  -o, --voiceEnabled=<option>    Filters numbers based on voice capability.
                                 <options: true|false>
  -p, --phoneNumber=<value>      Only show incoming phone number resources that match this PCRE-compatible regular
                                 expression.
  -r, --region=<value>           Filters numbers by two letter state abbreviation. This flag is only available for US
                                 numbers.
      --fields=<value>           Comma-separated list of fields to include in the response. Limits output to protect
                                 context windows when used by agents.
      --json                     Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Retrieve a list of Incoming Phone Numbers associated with the specified account, sorted from newest to oldest.
```

_See code: [src/commands/incoming-numbers/list.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/incoming-numbers/list.ts)_

## `freeclimb incoming-numbers:update [PHONENUMBERID]`

Update the properties of the specified incoming phone number.

```
USAGE
  $ freeclimb incoming-numbers:update [PHONENUMBERID] [-A <value>] [-a <value>] [--json] [--fields <value>] [--dry-run]
  [-h]

ARGUMENTS
  [PHONENUMBERID]  String that uniquely identifies this phone number resource.

FLAGS
  -A, --applicationId=<value>  ID of the Application that should handle calls to this number.
  -a, --alias=<value>          Description for this phone number.
  -h, --help                   Show CLI help.
      --dry-run                Validate the request without executing it. Shows what would be sent to the API.
      --fields=<value>         Comma-separated list of fields to include in the response. Limits output to protect
                               context windows when used by agents.
      --json                   Output as structured JSON. Also enabled via FREECLIMB_OUTPUT_FORMAT=json env var.

DESCRIPTION
  Update the properties of the specified incoming phone number.
```

_See code: [src/commands/incoming-numbers/update.ts](https://github.com/FreeClimbAPI/freeclimb-cli/blob/v0.6.0/src/commands/incoming-numbers/update.ts)_

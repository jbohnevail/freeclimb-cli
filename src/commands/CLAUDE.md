# Commands Directory

## ⚠️ Auto-Generated Code
Most files here are auto-generated from `generation/commands/`.
To modify command behavior, edit the templates there.

## Command Structure
Each command file:
- Extends oclif Command
- Exports static description, flags, args
- Implements async run() method
- Uses this.parse() for argument parsing
- Calls FreeClimbApi for API operations

## Adding a New Command
1. Create template in generation/commands/[topic]/
2. Run generation script
3. Add tests in test/commands/[topic]/

## Common Patterns
- Use spinner.start()/stop() for loading states
- Use output.ts formatters for consistent display
- Handle errors with FreeClimbError subclasses

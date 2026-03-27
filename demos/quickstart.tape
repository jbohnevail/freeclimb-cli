# FreeClimb CLI — Quickstart Demo
# Run: vhs demos/quickstart.tape

Output demos/out/quickstart.gif

Set Shell "bash"
Set FontSize 14
Set Width 1200
Set Height 600
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set WindowBarSize 40
Set TypingSpeed 40ms
Set Padding 20

Require freeclimb

# Login
Type "freeclimb login" Sleep 300ms Enter
Sleep 3s

# Check account status
Type "freeclimb status" Sleep 300ms Enter
Sleep 3s

# List phone numbers
Type "freeclimb incoming-numbers:list" Sleep 300ms Enter
Sleep 3s

# Send an SMS (dry-run)
Type "freeclimb sms:send --to +15551234567 --from +15559876543 --text 'Hello from FreeClimb!' --dry-run" Sleep 300ms Enter
Sleep 4s

Sleep 2s

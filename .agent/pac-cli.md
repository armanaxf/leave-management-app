# PAC CLI Usage

## Location
PAC is NOT on the bash PATH. Always use the full path:
```
"C:\Users\joshg\AppData\Local\Microsoft\PowerAppsCLI\pac.cmd"
```

## Version
Microsoft PowerPlatform CLI v1.51.1

## Auth Profiles
- **[1] Active** - josh@youkay.com → Josh Giles env (https://org53e499d9.crm11.dynamics.com/) — matches project's power.config.json
- **[2]** - GA-Josh.giles@tnlyy.onmicrosoft.com → Demo Environment (https://org45a710fb.crm4.dynamics.com/)
- **[3] Active** - josh@youkay.com → PDE-Josh-Giles (https://org53e499d9.crm11.dynamics.com/)

## Available Commands
```
pac admin | application | auth | canvas | catalog | code | connection | connector
pac copilot | data | env | help | managed-identity | modelbuilder | package
pac pages | pcf | pipeline | plugin | power-fx | solution | telemetry | test | tool
```

## Key Commands for This Project
- `pac auth list` — List auth profiles
- `pac env list` — List environments
- `pac code` — (Preview) Commands for Code apps
- `pac solution` — Solution project commands
- `pac data` — Import/export Dataverse data
- `pac modelbuilder` — Code generator for Dataverse APIs and Tables

## Notes
- The `--version` flag doesn't work; PAC uses subcommand-based CLI (no global flags like --version)
- Use `pac help` or `pac [command] help` for usage info

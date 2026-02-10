# Code Apps: Connecting to Data Sources

Source: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-data

## Overview
Three-step process: create connections (in Power Apps UI) → add to code app (PAC CLI) → use generated services in code.

## Adding Data Sources

### Dataverse Tables
```bash
pac code add-data-source -a dataverse -t <table-logical-name>
```

### Non-tabular (e.g. Office 365 Users)
```bash
pac code add-data-source -a <apiName> -c <connectionId>
# Example:
pac code add-data-source -a "shared_office365users" -c "aaaa0000bbbb1111cccc"
```

### Tabular (SQL, SharePoint)
```bash
pac code add-data-source -a <apiName> -c <connectionId> -t <tableId> -d <datasetName>
```

### SQL Stored Procedures
```bash
pac code add-data-source -a <apiId> -c <connectionId> -d <dataSourceName> -sp <storedProcedureName>
```

### With Connection References (v1.51.1+, for ALM/solutions)
```bash
pac code add-data-source -a <apiName> -cr <connectionReferenceLogicalName> -s <solutionID>
```

## Discovery Commands

```bash
# List connections
pac connection list

# List available datasets
pac code list-datasets -a <apiId> -c <connectionId>

# List tables in a dataset
pac code list-tables -a <apiId> -c <connectionId> -d <datasetName>

# List SQL stored procedures
pac code list-sql-stored-procedures -c <connectionId> -d <datasetName>

# List connection references in a solution
pac code list-connection-references -env <environmentURL> -s <solutionID>

# List solutions
pac solution list --json
```

## Deleting Data Sources

```bash
pac code delete-data-source -a <apiName> -ds <dataSourceName>
```
**Note:** If schema changes, must delete and re-add (no refresh command exists).

## Generated Files

Adding a data source generates:
- `generated/models/<Name>Model.ts` — Request/response types
- `generated/services/<Name>Service.ts` — Service methods

## Office 365 Users Example

```typescript
import { Office365UsersService } from './generated/services/Office365UsersService';

// Get current user profile
const profile = (await Office365UsersService.MyProfile_V2(
  "id,displayName,jobTitle,userPrincipalName"
)).data;

// Get user photo (base64)
const photoData = (await Office365UsersService.UserPhoto_V2(
  profile.id || profile.userPrincipalName
)).data;
const photoUrl = `data:image/jpeg;base64,${photoData}`;
```

## Build & Deploy

```bash
# Local dev
npm run dev

# Build and push to Power Apps
npm run build | pac code push
```

## Limitations
- Cannot create new connections via PAC CLI (must use Power Apps UI)
- Excel Online connectors not supported
- No schema refresh; must delete and re-add data sources
- Table/dataset names are case-sensitive
- Connection references require v1.51.1+

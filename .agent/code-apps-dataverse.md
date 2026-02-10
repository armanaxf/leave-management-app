# Code Apps: Connecting to Dataverse

Source: https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse

## Adding Dataverse Tables

```bash
pac code add-data-source -a dataverse -t <table-logical-name>
```

This generates two files in `/generated/`:
- `generated/models/<TableName>Model.ts` — Data model types
- `generated/services/<TableName>Service.ts` — CRUD service methods

## Generated Service API

### Import
```typescript
import { AccountsService } from './generated/services/AccountsService';
import type { Accounts } from './generated/models/AccountsModel';
```

### Create
```typescript
const newRecord = { name: "New Account", statecode: 0 };
const result = await AccountsService.create(newRecord as Omit<Accounts, 'accountid'>);
// result.data contains the created record
```

### Read (Single)
```typescript
const result = await AccountsService.get(recordId);
// result.data contains the record
```

### Read (Multiple)
```typescript
const result = await AccountsService.getAll(options?);
// result.data contains the array of records
```

### IGetAllOptions
```typescript
interface IGetAllOptions {
  maxPageSize?: number;    // Records per page
  select?: string[];       // Columns to retrieve
  filter?: string;         // OData filter string
  orderBy?: string[];      // Sort fields (e.g. ['name asc'])
  top?: number;            // Max records to retrieve
  skip?: number;           // Records to skip
  skipToken?: string;      // Pagination token
}
```

### Update
Only include changed properties to avoid triggering unintended business logic:
```typescript
const changes = { name: "Updated Name", telephone1: "555-0123" };
await AccountsService.update(recordId, changes);
```

### Delete
```typescript
await AccountsService.delete(recordId);
```

## Supported
- CRUD operations
- Formatted values / display names for option sets
- Table metadata
- Lookups (with some limitations)
- Delegation for Filter, Sort, Top
- Paging support

## Unsupported
- Polymorphic lookups
- Dataverse actions and functions
- Deleting datasources via PAC CLI
- Schema definition CRUD
- FetchXML
- Alternate key support

## Performance Notes
- Always use `select` to limit columns retrieved
- Exclude system-managed / read-only columns when creating records

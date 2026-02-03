/**
 * Dataverse Table Creation Script
 * Creates Leave Management tables via Dataverse Web API
 * 
 * Usage: npx ts-node scripts/create-dataverse-tables.ts
 */

import { initialize, getDataverseUrl, getAccessToken } from '@microsoft/power-apps';

const PUBLISHER_PREFIX = 'lm';

interface ColumnDefinition {
    SchemaName: string;
    DisplayName: { '@odata.type': string; LocalizedLabels: { Label: string; LanguageCode: number }[] };
    Description?: { '@odata.type': string; LocalizedLabels: { Label: string; LanguageCode: number }[] };
    AttributeType: string;
    RequiredLevel?: { Value: string };
    MaxLength?: number;
    MinValue?: number;
    MaxValue?: number;
    Precision?: number;
    DefaultValue?: boolean;
    Format?: string;
    ImeMode?: string;
}

interface TableDefinition {
    SchemaName: string;
    DisplayName: { '@odata.type': string; LocalizedLabels: { Label: string; LanguageCode: number }[] };
    DisplayCollectionName: { '@odata.type': string; LocalizedLabels: { Label: string; LanguageCode: number }[] };
    Description: { '@odata.type': string; LocalizedLabels: { Label: string; LanguageCode: number }[] };
    OwnershipType: string;
    IsActivity: boolean;
    HasActivities: boolean;
    HasNotes: boolean;
    PrimaryNameAttribute: string;
    Attributes: ColumnDefinition[];
}

function createLabel(text: string) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.Label',
        LocalizedLabels: [{ Label: text, LanguageCode: 1033 }]
    };
}

function createStringColumn(name: string, displayName: string, description: string, maxLength: number, required = false): ColumnDefinition {
    return {
        SchemaName: `${PUBLISHER_PREFIX}_${name}`,
        DisplayName: createLabel(displayName),
        Description: createLabel(description),
        AttributeType: 'String',
        RequiredLevel: { Value: required ? 'ApplicationRequired' : 'None' },
        MaxLength: maxLength,
        Format: 'Text',
        ImeMode: 'Auto'
    };
}

function createIntColumn(name: string, displayName: string, description: string, min: number, max: number): ColumnDefinition {
    return {
        SchemaName: `${PUBLISHER_PREFIX}_${name}`,
        DisplayName: createLabel(displayName),
        Description: createLabel(description),
        AttributeType: 'Integer',
        RequiredLevel: { Value: 'None' },
        MinValue: min,
        MaxValue: max
    };
}

function createBoolColumn(name: string, displayName: string, description: string, defaultValue: boolean): ColumnDefinition {
    return {
        SchemaName: `${PUBLISHER_PREFIX}_${name}`,
        DisplayName: createLabel(displayName),
        Description: createLabel(description),
        AttributeType: 'Boolean',
        DefaultValue: defaultValue
    };
}

function createDecimalColumn(name: string, displayName: string, description: string, precision: number): ColumnDefinition {
    return {
        SchemaName: `${PUBLISHER_PREFIX}_${name}`,
        DisplayName: createLabel(displayName),
        Description: createLabel(description),
        AttributeType: 'Decimal',
        RequiredLevel: { Value: 'None' },
        Precision: precision,
        MinValue: 0,
        MaxValue: 365
    };
}

function createDateColumn(name: string, displayName: string, description: string): ColumnDefinition {
    return {
        SchemaName: `${PUBLISHER_PREFIX}_${name}`,
        DisplayName: createLabel(displayName),
        Description: createLabel(description),
        AttributeType: 'DateTime',
        RequiredLevel: { Value: 'None' },
        Format: 'DateOnly'
    };
}

// Table Definitions
const tables: TableDefinition[] = [
    {
        SchemaName: `${PUBLISHER_PREFIX}_leavetype`,
        DisplayName: createLabel('Leave Type'),
        DisplayCollectionName: createLabel('Leave Types'),
        Description: createLabel('Leave categories available for employees'),
        OwnershipType: 'UserOwned',
        IsActivity: false,
        HasActivities: false,
        HasNotes: false,
        PrimaryNameAttribute: `${PUBLISHER_PREFIX}_name`,
        Attributes: [
            createStringColumn('name', 'Name', 'Display name of the leave type', 100, true),
            createStringColumn('code', 'Code', 'Short code (e.g., AL, SL)', 10, true),
            createStringColumn('color', 'Color', 'Hex color code for UI', 20),
            createStringColumn('icon', 'Icon', 'Lucide icon name', 50),
            createBoolColumn('requiresapproval', 'Requires Approval', 'Whether manager approval is required', true),
            createIntColumn('maxdaysperrequest', 'Max Days Per Request', 'Maximum days per single request', 0, 365),
            createBoolColumn('isactive', 'Is Active', 'Whether this leave type is active', true),
            createIntColumn('sortorder', 'Sort Order', 'Display order in lists', 0, 1000)
        ]
    },
    {
        SchemaName: `${PUBLISHER_PREFIX}_leaverequest`,
        DisplayName: createLabel('Leave Request'),
        DisplayCollectionName: createLabel('Leave Requests'),
        Description: createLabel('Employee leave requests'),
        OwnershipType: 'UserOwned',
        IsActivity: false,
        HasActivities: false,
        HasNotes: true,
        PrimaryNameAttribute: `${PUBLISHER_PREFIX}_employeename`,
        Attributes: [
            createStringColumn('employeeid', 'Employee ID', 'AAD Object ID of employee', 50, true),
            createStringColumn('employeeemail', 'Employee Email', 'Email address', 200),
            createStringColumn('employeename', 'Employee Name', 'Display name', 200),
            createDateColumn('startdate', 'Start Date', 'First day of leave'),
            createDateColumn('enddate', 'End Date', 'Last day of leave'),
            createBoolColumn('halfdaystart', 'Half Day Start', 'Morning only on start date', false),
            createBoolColumn('halfdayend', 'Half Day End', 'Afternoon only on end date', false),
            createDecimalColumn('totaldays', 'Total Days', 'Total working days requested', 2),
            createStringColumn('reason', 'Reason', 'Optional reason for leave', 500),
            createStringColumn('approverid', 'Approver ID', 'AAD Object ID of approver', 50),
            createStringColumn('approvername', 'Approver Name', 'Display name of approver', 200),
            createStringColumn('approvercomments', 'Approver Comments', 'Rejection reason or comments', 500)
        ]
    },
    {
        SchemaName: `${PUBLISHER_PREFIX}_leavebalance`,
        DisplayName: createLabel('Leave Balance'),
        DisplayCollectionName: createLabel('Leave Balances'),
        Description: createLabel('Employee leave balances per year'),
        OwnershipType: 'UserOwned',
        IsActivity: false,
        HasActivities: false,
        HasNotes: false,
        PrimaryNameAttribute: `${PUBLISHER_PREFIX}_employeeid`,
        Attributes: [
            createStringColumn('employeeid', 'Employee ID', 'AAD Object ID of employee', 50, true),
            createIntColumn('year', 'Year', 'Balance year', 2020, 2100),
            createDecimalColumn('entitlement', 'Entitlement', 'Total days entitled', 2),
            createDecimalColumn('used', 'Used', 'Days already taken', 2),
            createDecimalColumn('pending', 'Pending', 'Days in pending requests', 2),
            createDecimalColumn('carryover', 'Carry Over', 'Days carried from previous year', 2)
        ]
    },
    {
        SchemaName: `${PUBLISHER_PREFIX}_publicholiday`,
        DisplayName: createLabel('Public Holiday'),
        DisplayCollectionName: createLabel('Public Holidays'),
        Description: createLabel('Public holidays by region'),
        OwnershipType: 'OrganizationOwned',
        IsActivity: false,
        HasActivities: false,
        HasNotes: false,
        PrimaryNameAttribute: `${PUBLISHER_PREFIX}_name`,
        Attributes: [
            createStringColumn('name', 'Name', 'Holiday name', 100, true),
            createDateColumn('date', 'Date', 'Holiday date'),
            createStringColumn('region', 'Region', 'Region code (GB, US, etc.)', 10),
            createBoolColumn('isrecurring', 'Is Recurring', 'Whether holiday repeats annually', true)
        ]
    },
    {
        SchemaName: `${PUBLISHER_PREFIX}_appsetting`,
        DisplayName: createLabel('App Setting'),
        DisplayCollectionName: createLabel('App Settings'),
        Description: createLabel('Application configuration settings'),
        OwnershipType: 'OrganizationOwned',
        IsActivity: false,
        HasActivities: false,
        HasNotes: false,
        PrimaryNameAttribute: `${PUBLISHER_PREFIX}_key`,
        Attributes: [
            createStringColumn('key', 'Key', 'Setting key', 50, true),
            createStringColumn('value', 'Value', 'Setting value', 500)
        ]
    }
];

async function createTable(baseUrl: string, accessToken: string, table: TableDefinition) {
    console.log(`Creating table: ${table.SchemaName}...`);

    const response = await fetch(`${baseUrl}/api/data/v9.2/EntityDefinitions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0'
        },
        body: JSON.stringify({
            '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
            ...table
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create table ${table.SchemaName}: ${error}`);
    }

    console.log(`✓ Created table: ${table.SchemaName}`);
    return response.headers.get('OData-EntityId');
}

async function main() {
    console.log('Initializing Power Apps SDK...');
    await initialize();

    const baseUrl = getDataverseUrl();
    const accessToken = await getAccessToken();

    if (!baseUrl || !accessToken) {
        console.error('Failed to get Dataverse URL or access token. Ensure you are authenticated.');
        process.exit(1);
    }

    console.log(`Connected to: ${baseUrl}`);
    console.log('');

    for (const table of tables) {
        try {
            await createTable(baseUrl, accessToken, table);
        } catch (error) {
            console.error(`✗ Error creating ${table.SchemaName}:`, error);
        }
    }

    console.log('');
    console.log('Table creation complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add tables to your solution in Maker Portal');
    console.log('2. Run: pac code add-data-source -a dataverse -t lm_leavetype');
    console.log('3. Repeat for other tables');
}

main().catch(console.error);

/**
 * Dataverse Table Creation Script
 * Creates Leave Management tables via Dataverse Web API
 * 
 * Prerequisites:
 * 1. Run: pac auth list (ensure you're authenticated)
 * 2. Run this script: node scripts/create-dataverse-tables.mjs
 */

const PUBLISHER_PREFIX = 'lm';

// Get environment URL from power.config.json
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

function getDataverseUrl() {
    try {
        const config = JSON.parse(readFileSync('./power.config.json', 'utf8'));
        // Construct the Dataverse URL from environment ID
        // The format is: https://{orgname}.crm{region}.dynamics.com
        // We'll get this from pac auth list
        const authOutput = execSync('pac auth list', { encoding: 'utf8' });
        const urlMatch = authOutput.match(/https:\/\/[^\s]+\.dynamics\.com/);
        if (urlMatch) {
            return urlMatch[0].replace(/\/$/, '');
        }
        throw new Error('Could not find Dataverse URL in pac auth list');
    } catch (error) {
        console.error('Error getting Dataverse URL:', error.message);
        process.exit(1);
    }
}

async function getAccessToken() {
    try {
        // Use pac CLI to get access token
        const tokenOutput = execSync('pac auth token --audience "https://globaldisco.crm.dynamics.com"', { encoding: 'utf8' });
        return tokenOutput.trim();
    } catch (error) {
        console.error('Error getting access token:', error.message);
        process.exit(1);
    }
}

function createLabel(text) {
    return {
        '@odata.type': 'Microsoft.Dynamics.CRM.Label',
        LocalizedLabels: [{ Label: text, LanguageCode: 1033 }]
    };
}

// Table definitions
const tables = [
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
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_name`, RequiredLevel: { Value: 'ApplicationRequired' }, MaxLength: 100, FormatName: { Value: 'Text' }, DisplayName: createLabel('Name'), Description: createLabel('Display name of the leave type') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_code`, RequiredLevel: { Value: 'ApplicationRequired' }, MaxLength: 10, FormatName: { Value: 'Text' }, DisplayName: createLabel('Code'), Description: createLabel('Short code (e.g., AL, SL)') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_color`, RequiredLevel: { Value: 'None' }, MaxLength: 20, FormatName: { Value: 'Text' }, DisplayName: createLabel('Color'), Description: createLabel('Hex color code for UI') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_icon`, RequiredLevel: { Value: 'None' }, MaxLength: 50, FormatName: { Value: 'Text' }, DisplayName: createLabel('Icon'), Description: createLabel('Lucide icon name') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_requiresapproval`, DefaultValue: true, DisplayName: createLabel('Requires Approval'), Description: createLabel('Whether manager approval is required'), OptionSet: { TrueOption: { Value: 1, Label: createLabel('Yes') }, FalseOption: { Value: 0, Label: createLabel('No') } } },
            { '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_maxdaysperrequest`, MinValue: 0, MaxValue: 365, DisplayName: createLabel('Max Days Per Request'), Description: createLabel('Maximum days per request') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_isactive`, DefaultValue: true, DisplayName: createLabel('Is Active'), Description: createLabel('Whether this leave type is active'), OptionSet: { TrueOption: { Value: 1, Label: createLabel('Yes') }, FalseOption: { Value: 0, Label: createLabel('No') } } },
            { '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_sortorder`, MinValue: 0, MaxValue: 1000, DisplayName: createLabel('Sort Order'), Description: createLabel('Display order in lists') }
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
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_employeeid`, RequiredLevel: { Value: 'ApplicationRequired' }, MaxLength: 50, FormatName: { Value: 'Text' }, DisplayName: createLabel('Employee ID'), Description: createLabel('AAD Object ID') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_employeeemail`, RequiredLevel: { Value: 'None' }, MaxLength: 200, FormatName: { Value: 'Email' }, DisplayName: createLabel('Employee Email'), Description: createLabel('Email address') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_employeename`, RequiredLevel: { Value: 'None' }, MaxLength: 200, FormatName: { Value: 'Text' }, DisplayName: createLabel('Employee Name'), Description: createLabel('Display name') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_startdate`, Format: 'DateOnly', DisplayName: createLabel('Start Date'), Description: createLabel('First day of leave') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_enddate`, Format: 'DateOnly', DisplayName: createLabel('End Date'), Description: createLabel('Last day of leave') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_halfdaystart`, DefaultValue: false, DisplayName: createLabel('Half Day Start'), Description: createLabel('Morning only on start date'), OptionSet: { TrueOption: { Value: 1, Label: createLabel('Yes') }, FalseOption: { Value: 0, Label: createLabel('No') } } },
            { '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_halfdayend`, DefaultValue: false, DisplayName: createLabel('Half Day End'), Description: createLabel('Afternoon only on end date'), OptionSet: { TrueOption: { Value: 1, Label: createLabel('Yes') }, FalseOption: { Value: 0, Label: createLabel('No') } } },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_totaldays`, Precision: 2, MinValue: 0, MaxValue: 365, DisplayName: createLabel('Total Days'), Description: createLabel('Total working days requested') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_reason`, RequiredLevel: { Value: 'None' }, MaxLength: 500, FormatName: { Value: 'Text' }, DisplayName: createLabel('Reason'), Description: createLabel('Optional reason') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_approverid`, RequiredLevel: { Value: 'None' }, MaxLength: 50, FormatName: { Value: 'Text' }, DisplayName: createLabel('Approver ID'), Description: createLabel('AAD Object ID of approver') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_approvername`, RequiredLevel: { Value: 'None' }, MaxLength: 200, FormatName: { Value: 'Text' }, DisplayName: createLabel('Approver Name'), Description: createLabel('Display name of approver') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_approvercomments`, RequiredLevel: { Value: 'None' }, MaxLength: 500, FormatName: { Value: 'Text' }, DisplayName: createLabel('Approver Comments'), Description: createLabel('Rejection reason or comments') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_approvedat`, Format: 'DateAndTime', DisplayName: createLabel('Approved At'), Description: createLabel('Approval timestamp') }
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
        PrimaryNameAttribute: `${PUBLISHER_PREFIX}_name`,
        Attributes: [
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_name`, RequiredLevel: { Value: 'None' }, MaxLength: 100, FormatName: { Value: 'Text' }, DisplayName: createLabel('Name'), Description: createLabel('Display name') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_employeeid`, RequiredLevel: { Value: 'ApplicationRequired' }, MaxLength: 50, FormatName: { Value: 'Text' }, DisplayName: createLabel('Employee ID'), Description: createLabel('AAD Object ID') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.IntegerAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_year`, MinValue: 2020, MaxValue: 2100, DisplayName: createLabel('Year'), Description: createLabel('Balance year') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_entitlement`, Precision: 2, MinValue: 0, MaxValue: 365, DisplayName: createLabel('Entitlement'), Description: createLabel('Total days entitled') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_used`, Precision: 2, MinValue: 0, MaxValue: 365, DisplayName: createLabel('Used'), Description: createLabel('Days already taken') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_pending`, Precision: 2, MinValue: 0, MaxValue: 365, DisplayName: createLabel('Pending'), Description: createLabel('Days in pending requests') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DecimalAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_carryover`, Precision: 2, MinValue: 0, MaxValue: 365, DisplayName: createLabel('Carry Over'), Description: createLabel('Days carried from previous year') }
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
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_name`, RequiredLevel: { Value: 'ApplicationRequired' }, MaxLength: 100, FormatName: { Value: 'Text' }, DisplayName: createLabel('Name'), Description: createLabel('Holiday name') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.DateTimeAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_date`, Format: 'DateOnly', DisplayName: createLabel('Date'), Description: createLabel('Holiday date') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_region`, RequiredLevel: { Value: 'None' }, MaxLength: 10, FormatName: { Value: 'Text' }, DisplayName: createLabel('Region'), Description: createLabel('Region code (GB, US, etc.)') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_isrecurring`, DefaultValue: true, DisplayName: createLabel('Is Recurring'), Description: createLabel('Whether holiday repeats annually'), OptionSet: { TrueOption: { Value: 1, Label: createLabel('Yes') }, FalseOption: { Value: 0, Label: createLabel('No') } } }
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
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_key`, RequiredLevel: { Value: 'ApplicationRequired' }, MaxLength: 50, FormatName: { Value: 'Text' }, DisplayName: createLabel('Key'), Description: createLabel('Setting key') },
            { '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata', SchemaName: `${PUBLISHER_PREFIX}_value`, RequiredLevel: { Value: 'None' }, MaxLength: 500, FormatName: { Value: 'Text' }, DisplayName: createLabel('Value'), Description: createLabel('Setting value') }
        ]
    }
];

async function createTable(baseUrl, accessToken, table) {
    console.log(`Creating table: ${table.SchemaName}...`);

    const payload = {
        '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
        ...table
    };

    const response = await fetch(`${baseUrl}/api/data/v9.2/EntityDefinitions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`✗ Failed to create table ${table.SchemaName}:`, error);
        return false;
    }

    console.log(`✓ Created table: ${table.SchemaName}`);
    return true;
}

async function main() {
    console.log('='.repeat(50));
    console.log('Dataverse Table Creation Script');
    console.log('='.repeat(50));
    console.log('');

    const baseUrl = getDataverseUrl();
    console.log(`Dataverse URL: ${baseUrl}`);

    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✓ Got access token');
    console.log('');

    let successCount = 0;
    let failCount = 0;

    for (const table of tables) {
        const success = await createTable(baseUrl, accessToken, table);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log(`Results: ${successCount} created, ${failCount} failed`);
    console.log('='.repeat(50));
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to make.powerapps.com → Solutions');
    console.log('2. Open or create a solution');
    console.log('3. Add existing → Tables → Select the lm_* tables');
    console.log('4. Run: pac code add-data-source -a dataverse -t lm_leavetype');
}

main().catch(console.error);

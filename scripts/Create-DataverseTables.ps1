<#
.SYNOPSIS
    Creates Dataverse tables for Leave Management App

.DESCRIPTION
    This script creates the following tables in Dataverse:
    - lm_leavetype (Leave Types)
    - lm_leaverequest (Leave Requests)
    - lm_leavebalance (Leave Balances)
    - lm_publicholiday (Public Holidays)
    - lm_appsetting (App Settings)

.NOTES
    Prerequisites:
    1. Install MSAL.PS module: Install-Module -Name MSAL.PS -Scope CurrentUser
    2. Have access to Dataverse environment

.EXAMPLE
    .\Create-DataverseTables.ps1
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$EnvironmentUrl
)

$ErrorActionPreference = "Stop"

# Auto-detect environment URL from pac CLI if not provided
if (-not $EnvironmentUrl) {
    try {
        $pacOutput = pac org who 2>&1 | Out-String
        if ($pacOutput -match "Org URL:\s*(https://[^\s]+)") {
            $EnvironmentUrl = $matches[1].TrimEnd('/')
            Write-Host "[OK] Auto-detected environment: $EnvironmentUrl" -ForegroundColor Green
        } else {
            throw "Could not parse Org URL from pac org who output"
        }
    }
    catch {
        Write-Host "[XX] Failed to auto-detect environment. Please provide -EnvironmentUrl parameter." -ForegroundColor Red
        Write-Host "    Run 'pac org who' to see your connected environment." -ForegroundColor Yellow
        exit 1
    }
}

# Colors for output
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[..] $Message" -ForegroundColor Cyan }
function Write-Warn { param($Message) Write-Host "[!!] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[XX] $Message" -ForegroundColor Red }

# Get access token using MSAL with Dynamics 365 public client
function Get-DataverseToken {
    param([string]$ResourceUrl)
    
    Write-Info "Getting access token for $ResourceUrl..."
    
    # Ensure resource URL ends with / for Dynamics 365
    $resource = $ResourceUrl.TrimEnd('/') + "/"
    
    # Use the PowerApps CLI client ID which supports device code flow
    $clientId = "9cee029c-6210-4654-90bb-17e6e9d36617"
    
    # Try MSAL.PS module with device code flow
    try {
        Import-Module MSAL.PS -ErrorAction Stop
        
        Write-Host ""
        Write-Host "=== AUTHENTICATION REQUIRED ===" -ForegroundColor Yellow
        Write-Host "A browser will open. Please sign in with your Dynamics 365 account." -ForegroundColor Yellow
        Write-Host ""
        
        $tokenResponse = Get-MsalToken -ClientId $clientId `
            -Scopes "$($resource)user_impersonation" `
            -DeviceCode `
            -ErrorAction Stop
        
        Write-Success "Got token via device code flow"
        return $tokenResponse.AccessToken
    }
    catch {
        Write-Warn "MSAL device code failed: $($_.Exception.Message)"
    }
    
    throw "Failed to get access token. Please install MSAL.PS module: Install-Module MSAL.PS -Scope CurrentUser"
}

# Create a table via Web API
function New-DataverseTable {
    param(
        [string]$BaseUrl,
        [string]$Token,
        [string]$SchemaName,
        [string]$DisplayName,
        [string]$DisplayNamePlural,
        [string]$Description,
        [string]$OwnershipType,
        [string]$PrimaryAttributeName,
        [string]$PrimaryAttributeDisplayName
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
        "OData-MaxVersion" = "4.0"
        "OData-Version" = "4.0"
    }
    
    Write-Info "Creating table: $SchemaName..."
    
    # Build the entity definition with inline primary attribute
    $entityDef = @{
        "@odata.type" = "Microsoft.Dynamics.CRM.EntityMetadata"
        SchemaName = $SchemaName
        DisplayName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(
                @{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 }
            )
        }
        DisplayCollectionName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(
                @{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayNamePlural; LanguageCode = 1033 }
            )
        }
        Description = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(
                @{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $Description; LanguageCode = 1033 }
            )
        }
        OwnershipType = $OwnershipType
        IsActivity = $false
        HasActivities = $false
        HasNotes = $false
        PrimaryNameAttribute = $PrimaryAttributeName
        Attributes = @(
            @{
                "@odata.type" = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
                SchemaName = $PrimaryAttributeName
                RequiredLevel = @{ Value = "ApplicationRequired"; CanBeChanged = $true; ManagedPropertyLogicalName = "canmodifyrequirementlevelsettings" }
                MaxLength = 100
                FormatName = @{ Value = "Text" }
                IsPrimaryName = $true
                DisplayName = @{
                    "@odata.type" = "Microsoft.Dynamics.CRM.Label"
                    LocalizedLabels = @(
                        @{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $PrimaryAttributeDisplayName; LanguageCode = 1033 }
                    )
                }
            }
        )
    }
    
    $body = $entityDef | ConvertTo-Json -Depth 20 -Compress
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/data/v9.2/EntityDefinitions" -Method Post -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
        Write-Success "Created table: $SchemaName"
        return $true
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails.error.message -like "*already exists*") {
            Write-Warn "Table $SchemaName already exists - skipping creation"
            return $true
        }
        Write-Err "Failed to create $SchemaName : $($_.Exception.Message)"
        if ($errorDetails) {
            Write-Err "Details: $($errorDetails.error.message)"
        }
        return $false
    }
}

# Add a column to an existing table
function Add-DataverseColumn {
    param(
        [string]$BaseUrl,
        [string]$Token,
        [string]$TableSchemaName,
        [hashtable]$ColumnDefinition
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
        "OData-MaxVersion" = "4.0"
        "OData-Version" = "4.0"
    }
    
    $columnName = $ColumnDefinition.SchemaName
    Write-Info "  Adding column: $columnName..."
    
    $body = $ColumnDefinition | ConvertTo-Json -Depth 10 -Compress
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/data/v9.2/EntityDefinitions(LogicalName='$($TableSchemaName.ToLower())')/Attributes" -Method Post -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
        Write-Success "  Added column: $columnName"
        return $true
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails.error.message -like "*already exists*") {
            Write-Warn "  Column $columnName already exists - skipping"
            return $true
        }
        Write-Err "  Failed to add $columnName : $($_.Exception.Message)"
        if ($errorDetails) {
            Write-Err "  Details: $($errorDetails.error.message)"
        }
        return $false
    }
}

# Helper to build column definitions
function New-StringColumn {
    param([string]$SchemaName, [string]$DisplayName, [int]$MaxLength = 100, [string]$Format = "Text", [bool]$Required = $false)
    return @{
        "@odata.type" = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
        SchemaName = $SchemaName
        MaxLength = $MaxLength
        FormatName = @{ Value = $Format }
        RequiredLevel = @{ Value = if ($Required) { "ApplicationRequired" } else { "None" } }
        DisplayName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 })
        }
    }
}

function New-IntegerColumn {
    param([string]$SchemaName, [string]$DisplayName, [int]$MinValue = 0, [int]$MaxValue = 2147483647)
    return @{
        "@odata.type" = "Microsoft.Dynamics.CRM.IntegerAttributeMetadata"
        SchemaName = $SchemaName
        MinValue = $MinValue
        MaxValue = $MaxValue
        DisplayName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 })
        }
    }
}

function New-DecimalColumn {
    param([string]$SchemaName, [string]$DisplayName, [int]$Precision = 2)
    return @{
        "@odata.type" = "Microsoft.Dynamics.CRM.DecimalAttributeMetadata"
        SchemaName = $SchemaName
        Precision = $Precision
        MinValue = 0
        MaxValue = 1000000
        DisplayName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 })
        }
    }
}

function New-BooleanColumn {
    param([string]$SchemaName, [string]$DisplayName, [bool]$DefaultValue = $false)
    return @{
        "@odata.type" = "Microsoft.Dynamics.CRM.BooleanAttributeMetadata"
        SchemaName = $SchemaName
        DefaultValue = $DefaultValue
        DisplayName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 })
        }
        OptionSet = @{
            TrueOption = @{ Value = 1; Label = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "Yes"; LanguageCode = 1033 }) } }
            FalseOption = @{ Value = 0; Label = @{ "@odata.type" = "Microsoft.Dynamics.CRM.Label"; LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "No"; LanguageCode = 1033 }) } }
        }
    }
}

function New-DateTimeColumn {
    param([string]$SchemaName, [string]$DisplayName, [string]$Format = "DateOnly")
    return @{
        "@odata.type" = "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata"
        SchemaName = $SchemaName
        Format = $Format
        DisplayName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 })
        }
    }
}

function New-MemoColumn {
    param([string]$SchemaName, [string]$DisplayName, [int]$MaxLength = 100000)
    return @{
        "@odata.type" = "Microsoft.Dynamics.CRM.MemoAttributeMetadata"
        SchemaName = $SchemaName
        MaxLength = $MaxLength
        FormatName = @{ Value = "TextArea" }
        DisplayName = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(@{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = $DisplayName; LanguageCode = 1033 })
        }
    }
}

# Main execution
Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  Dataverse Table Creation Script" -ForegroundColor Magenta
Write-Host "  Leave Management App" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

Write-Info "Environment: $EnvironmentUrl"
Write-Host ""

# Get token
$token = Get-DataverseToken -ResourceUrl $EnvironmentUrl
Write-Host ""

$prefix = "lm"
$successCount = 0
$failCount = 0

# ========================================
# Table 1: Leave Type
# ========================================
Write-Host "`n--- Leave Type Table ---" -ForegroundColor Cyan
$result = New-DataverseTable -BaseUrl $EnvironmentUrl -Token $token `
    -SchemaName "${prefix}_leavetype" `
    -DisplayName "Leave Type" `
    -DisplayNamePlural "Leave Types" `
    -Description "Leave categories available for employees" `
    -OwnershipType "UserOwned" `
    -PrimaryAttributeName "${prefix}_name" `
    -PrimaryAttributeDisplayName "Name"

if ($result) {
    $successCount++
    # Add additional columns
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavetype" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_code" -DisplayName "Code" -MaxLength 10 -Required $true)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavetype" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_color" -DisplayName "Color" -MaxLength 20)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavetype" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_icon" -DisplayName "Icon" -MaxLength 50)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavetype" -ColumnDefinition (New-BooleanColumn -SchemaName "${prefix}_requiresapproval" -DisplayName "Requires Approval" -DefaultValue $true)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavetype" -ColumnDefinition (New-IntegerColumn -SchemaName "${prefix}_maxdaysperrequest" -DisplayName "Max Days Per Request" -MinValue 0 -MaxValue 365)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavetype" -ColumnDefinition (New-BooleanColumn -SchemaName "${prefix}_isactive" -DisplayName "Is Active" -DefaultValue $true)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavetype" -ColumnDefinition (New-IntegerColumn -SchemaName "${prefix}_sortorder" -DisplayName "Sort Order" -MinValue 0 -MaxValue 1000)
} else { $failCount++ }

# ========================================
# Table 2: Leave Request
# ========================================
Write-Host "`n--- Leave Request Table ---" -ForegroundColor Cyan
$result = New-DataverseTable -BaseUrl $EnvironmentUrl -Token $token `
    -SchemaName "${prefix}_leaverequest" `
    -DisplayName "Leave Request" `
    -DisplayNamePlural "Leave Requests" `
    -Description "Employee leave requests" `
    -OwnershipType "UserOwned" `
    -PrimaryAttributeName "${prefix}_employeename" `
    -PrimaryAttributeDisplayName "Employee Name"

if ($result) {
    $successCount++
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_employeeid" -DisplayName "Employee ID" -MaxLength 50 -Required $true)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_employeeemail" -DisplayName "Employee Email" -MaxLength 200 -Format "Email")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-DateTimeColumn -SchemaName "${prefix}_startdate" -DisplayName "Start Date")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-DateTimeColumn -SchemaName "${prefix}_enddate" -DisplayName "End Date")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-BooleanColumn -SchemaName "${prefix}_halfdaystart" -DisplayName "Half Day Start")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-BooleanColumn -SchemaName "${prefix}_halfdayend" -DisplayName "Half Day End")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-DecimalColumn -SchemaName "${prefix}_totaldays" -DisplayName "Total Days")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_reason" -DisplayName "Reason" -MaxLength 500)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_approverid" -DisplayName "Approver ID" -MaxLength 50)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_approvername" -DisplayName "Approver Name" -MaxLength 200)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_approvercomments" -DisplayName "Approver Comments" -MaxLength 500)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leaverequest" -ColumnDefinition (New-DateTimeColumn -SchemaName "${prefix}_approvedat" -DisplayName "Approved At" -Format "DateAndTime")
} else { $failCount++ }

# ========================================
# Table 3: Leave Balance
# ========================================
Write-Host "`n--- Leave Balance Table ---" -ForegroundColor Cyan
$result = New-DataverseTable -BaseUrl $EnvironmentUrl -Token $token `
    -SchemaName "${prefix}_leavebalance" `
    -DisplayName "Leave Balance" `
    -DisplayNamePlural "Leave Balances" `
    -Description "Employee leave balances per year" `
    -OwnershipType "UserOwned" `
    -PrimaryAttributeName "${prefix}_name" `
    -PrimaryAttributeDisplayName "Name"

if ($result) {
    $successCount++
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavebalance" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_employeeid" -DisplayName "Employee ID" -MaxLength 50 -Required $true)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavebalance" -ColumnDefinition (New-IntegerColumn -SchemaName "${prefix}_year" -DisplayName "Year" -MinValue 2020 -MaxValue 2100)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavebalance" -ColumnDefinition (New-DecimalColumn -SchemaName "${prefix}_entitlement" -DisplayName "Entitlement")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavebalance" -ColumnDefinition (New-DecimalColumn -SchemaName "${prefix}_used" -DisplayName "Used")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavebalance" -ColumnDefinition (New-DecimalColumn -SchemaName "${prefix}_pending" -DisplayName "Pending")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_leavebalance" -ColumnDefinition (New-DecimalColumn -SchemaName "${prefix}_carryover" -DisplayName "Carry Over")
} else { $failCount++ }

# ========================================
# Table 4: Public Holiday
# ========================================
Write-Host "`n--- Public Holiday Table ---" -ForegroundColor Cyan
$result = New-DataverseTable -BaseUrl $EnvironmentUrl -Token $token `
    -SchemaName "${prefix}_publicholiday" `
    -DisplayName "Public Holiday" `
    -DisplayNamePlural "Public Holidays" `
    -Description "Public holidays by region" `
    -OwnershipType "OrganizationOwned" `
    -PrimaryAttributeName "${prefix}_name" `
    -PrimaryAttributeDisplayName "Name"

if ($result) {
    $successCount++
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_publicholiday" -ColumnDefinition (New-DateTimeColumn -SchemaName "${prefix}_date" -DisplayName "Date")
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_publicholiday" -ColumnDefinition (New-StringColumn -SchemaName "${prefix}_region" -DisplayName "Region" -MaxLength 10)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_publicholiday" -ColumnDefinition (New-BooleanColumn -SchemaName "${prefix}_isrecurring" -DisplayName "Is Recurring" -DefaultValue $true)
} else { $failCount++ }

# ========================================
# Table 5: App Setting
# ========================================
Write-Host "`n--- App Setting Table ---" -ForegroundColor Cyan
$result = New-DataverseTable -BaseUrl $EnvironmentUrl -Token $token `
    -SchemaName "${prefix}_appsetting" `
    -DisplayName "App Setting" `
    -DisplayNamePlural "App Settings" `
    -Description "Application configuration settings" `
    -OwnershipType "OrganizationOwned" `
    -PrimaryAttributeName "${prefix}_key" `
    -PrimaryAttributeDisplayName "Key"

if ($result) {
    $successCount++
    # Use New-MemoColumn for Value to support large content (like Base64 images)
    Add-DataverseColumn -BaseUrl $EnvironmentUrl -Token $token -TableSchemaName "${prefix}_appsetting" -ColumnDefinition (New-MemoColumn -SchemaName "${prefix}_value" -DisplayName "Value" -MaxLength 100000)
} else { $failCount++ }

# ========================================
# Summary
# ========================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
if ($failCount -eq 0) {
    Write-Host "  Results: $successCount tables created, $failCount failed" -ForegroundColor Green
} else {
    Write-Host "  Results: $successCount tables created, $failCount failed" -ForegroundColor Yellow
}
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to make.powerapps.com -> Solutions"
    Write-Host "2. Open or create your Leave Management solution"
    Write-Host "3. Add existing -> Tables -> Select the lm_* tables"
    Write-Host "4. Run: pac code add-data-source -a dataverse -t lm_leavetype"
    Write-Host ""
}

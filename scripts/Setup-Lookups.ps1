<#
.SYNOPSIS
    Creates lookup relationships and custom status codes for Leave Management tables

.DESCRIPTION
    This script creates:
    1. lm_leaverequest -> lm_leavetype (Leave Type lookup)
    2. lm_leaverequest -> systemuser (Employee lookup)
    3. lm_leaverequest -> systemuser (Approver lookup)
    4. lm_leavebalance -> lm_leavetype (Leave Type lookup)
    5. lm_leavebalance -> systemuser (Employee lookup)
    6. Custom status reasons on lm_leaverequest (Pending, Approved, Rejected, Cancelled)

.NOTES
    Prerequisites: Install-Module -Name MSAL.PS -Scope CurrentUser

.EXAMPLE
    .\Setup-Lookups.ps1
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$EnvironmentUrl
)

$ErrorActionPreference = "Stop"

# Auto-detect environment URL from pac CLI
if (-not $EnvironmentUrl) {
    try {
        $pacOutput = pac org who 2>&1 | Out-String
        if ($pacOutput -match "Org URL:\s*(https://[^\s]+)") {
            $EnvironmentUrl = $matches[1].TrimEnd('/')
            Write-Host "[OK] Auto-detected environment: $EnvironmentUrl" -ForegroundColor Green
        } else {
            throw "Could not parse Org URL"
        }
    }
    catch {
        Write-Host "[XX] Failed to auto-detect environment. Provide -EnvironmentUrl." -ForegroundColor Red
        exit 1
    }
}

function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[..] $Message" -ForegroundColor Cyan }
function Write-Warn { param($Message) Write-Host "[!!] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[XX] $Message" -ForegroundColor Red }

function Get-DataverseToken {
    param([string]$ResourceUrl)
    $resource = $ResourceUrl.TrimEnd('/') + "/"
    $clientId = "9cee029c-6210-4654-90bb-17e6e9d36617"
    try {
        Import-Module MSAL.PS -ErrorAction Stop
        Write-Host ""
        Write-Host "=== AUTHENTICATION REQUIRED ===" -ForegroundColor Yellow
        Write-Host "A browser will open. Please sign in with your Dynamics 365 account." -ForegroundColor Yellow
        Write-Host ""
        $tokenResponse = Get-MsalToken -ClientId $clientId `
            -Scopes "$($resource)user_impersonation" `
            -DeviceCode -ErrorAction Stop
        Write-Success "Got token via device code flow"
        return $tokenResponse.AccessToken
    }
    catch {
        throw "Failed to get access token. Install MSAL.PS: Install-Module MSAL.PS -Scope CurrentUser"
    }
}

function Get-Headers {
    param([string]$Token)
    return @{
        "Authorization"    = "Bearer $Token"
        "Content-Type"     = "application/json"
        "OData-MaxVersion" = "4.0"
        "OData-Version"    = "4.0"
    }
}

# Create a OneToMany lookup relationship
function New-LookupRelationship {
    param(
        [string]$BaseUrl,
        [string]$Token,
        [string]$ReferencingEntity,
        [string]$ReferencedEntity,
        [string]$LookupSchemaName,
        [string]$LookupDisplayName,
        [string]$RelationshipSchemaName
    )

    $headers = Get-Headers -Token $Token

    Write-Info "Creating lookup: $ReferencingEntity.$LookupSchemaName -> $ReferencedEntity"

    $body = @{
        "@odata.type" = "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata"
        SchemaName = $RelationshipSchemaName
        ReferencedEntity = $ReferencedEntity
        ReferencingEntity = $ReferencingEntity
        CascadeConfiguration = @{
            Assign   = "NoCascade"
            Delete   = "RemoveLink"
            Merge    = "NoCascade"
            Reparent = "NoCascade"
            Share    = "NoCascade"
            Unshare  = "NoCascade"
        }
        Lookup = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.LookupAttributeMetadata"
            SchemaName = $LookupSchemaName
            DisplayName = @{
                "@odata.type" = "Microsoft.Dynamics.CRM.Label"
                LocalizedLabels = @(
                    @{
                        "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"
                        Label = $LookupDisplayName
                        LanguageCode = 1033
                    }
                )
            }
            RequiredLevel = @{ Value = "None" }
        }
    } | ConvertTo-Json -Depth 15 -Compress

    try {
        $null = Invoke-RestMethod `
            -Uri "$BaseUrl/api/data/v9.2/RelationshipDefinitions" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ContentType "application/json; charset=utf-8"
        Write-Success "Created: $RelationshipSchemaName ($LookupSchemaName)"
        return $true
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        $errMsg = if ($errorDetails) { $errorDetails.error.message } else { $_.Exception.Message }
        if ($errMsg -like "*already exists*" -or $errMsg -like "*duplicate*") {
            Write-Warn "Relationship $RelationshipSchemaName already exists - skipping"
            return $true
        }
        Write-Err "Failed: $errMsg"
        return $false
    }
}

# Add a custom status reason value to an existing statuscode option set
function Add-StatusReason {
    param(
        [string]$BaseUrl,
        [string]$Token,
        [string]$EntityLogicalName,
        [int]$StateCode,
        [int]$Value,
        [string]$Label
    )

    $headers = Get-Headers -Token $Token

    Write-Info "Adding status reason: $Label (Value=$Value, StateCode=$StateCode)"

    $body = @{
        EntityLogicalName = $EntityLogicalName
        AttributeLogicalName = "statuscode"
        Value = $Value
        Label = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(
                @{
                    "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"
                    Label = $Label
                    LanguageCode = 1033
                }
            )
        }
        StateCode = $StateCode
    } | ConvertTo-Json -Depth 10 -Compress

    try {
        $response = Invoke-RestMethod `
            -Uri "$BaseUrl/api/data/v9.2/InsertStatusValue" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ContentType "application/json; charset=utf-8"
        # The response contains the actual value assigned by Dataverse
        $actualValue = $response.Value
        if (-not $actualValue) { $actualValue = $Value }
        Write-Success "Added status reason: $Label (actual value: $actualValue)"
        return $actualValue
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        $errMsg = if ($errorDetails) { $errorDetails.error.message } else { $_.Exception.Message }
        if ($errMsg -like "*already exists*" -or $errMsg -like "*duplicate*") {
            Write-Warn "Status reason $Label already exists - skipping (using value $Value)"
            return $Value
        }
        Write-Err "Failed to add status reason $Label : $errMsg"
        return $null
    }
}

# Rename an existing status reason label
function Rename-StatusReason {
    param(
        [string]$BaseUrl,
        [string]$Token,
        [string]$EntityLogicalName,
        [int]$Value,
        [string]$NewLabel
    )

    $headers = Get-Headers -Token $Token
    Write-Info "Renaming status reason value=$Value to '$NewLabel'"

    $body = @{
        EntityLogicalName = $EntityLogicalName
        AttributeLogicalName = "statuscode"
        Value = $Value
        Label = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.Label"
            LocalizedLabels = @(
                @{
                    "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"
                    Label = $NewLabel
                    LanguageCode = 1033
                }
            )
        }
        MergeLabels = $true
    } | ConvertTo-Json -Depth 10 -Compress

    try {
        Invoke-RestMethod `
            -Uri "$BaseUrl/api/data/v9.2/UpdateOptionValue" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ContentType "application/json; charset=utf-8"
        Write-Success "Renamed status reason value=$Value to '$NewLabel'"
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        $errMsg = if ($errorDetails) { $errorDetails.error.message } else { $_.Exception.Message }
        Write-Warn "Could not rename status reason: $errMsg (non-critical)"
    }
}

# ═══════════════════════════════════════════════════════════════
# Main Execution
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  Setup Dataverse Lookups & Status Codes" -ForegroundColor Magenta
Write-Host "  Leave Management App" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

Write-Info "Environment: $EnvironmentUrl"
Write-Host ""

$token = Get-DataverseToken -ResourceUrl $EnvironmentUrl
$successCount = 0
$failCount = 0

# ─────────────────────────────────────────────────────────────
# PART 1: Lookup Relationships
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "--- PART 1: Lookup Relationships ---" -ForegroundColor Cyan
Write-Host ""

# 1. Leave Request -> Leave Type
$result = New-LookupRelationship `
    -BaseUrl $EnvironmentUrl -Token $token `
    -ReferencingEntity "lm_leaverequest" `
    -ReferencedEntity "lm_leavetype" `
    -LookupSchemaName "lm_LeaveType" `
    -LookupDisplayName "Leave Type" `
    -RelationshipSchemaName "lm_leavetype_lm_leaverequest_LeaveType"
if ($result) { $successCount++ } else { $failCount++ }

# 2. Leave Request -> Employee (systemuser)
$result = New-LookupRelationship `
    -BaseUrl $EnvironmentUrl -Token $token `
    -ReferencingEntity "lm_leaverequest" `
    -ReferencedEntity "systemuser" `
    -LookupSchemaName "lm_Employee" `
    -LookupDisplayName "Employee" `
    -RelationshipSchemaName "lm_systemuser_lm_leaverequest_Employee"
if ($result) { $successCount++ } else { $failCount++ }

# 3. Leave Request -> Approver (systemuser)
$result = New-LookupRelationship `
    -BaseUrl $EnvironmentUrl -Token $token `
    -ReferencingEntity "lm_leaverequest" `
    -ReferencedEntity "systemuser" `
    -LookupSchemaName "lm_Approver" `
    -LookupDisplayName "Approver" `
    -RelationshipSchemaName "lm_systemuser_lm_leaverequest_Approver"
if ($result) { $successCount++ } else { $failCount++ }

# 4. Leave Balance -> Leave Type
$result = New-LookupRelationship `
    -BaseUrl $EnvironmentUrl -Token $token `
    -ReferencingEntity "lm_leavebalance" `
    -ReferencedEntity "lm_leavetype" `
    -LookupSchemaName "lm_LeaveType" `
    -LookupDisplayName "Leave Type" `
    -RelationshipSchemaName "lm_leavetype_lm_leavebalance_LeaveType"
if ($result) { $successCount++ } else { $failCount++ }

# 5. Leave Balance -> Employee (systemuser)
$result = New-LookupRelationship `
    -BaseUrl $EnvironmentUrl -Token $token `
    -ReferencingEntity "lm_leavebalance" `
    -ReferencedEntity "systemuser" `
    -LookupSchemaName "lm_Employee" `
    -LookupDisplayName "Employee" `
    -RelationshipSchemaName "lm_systemuser_lm_leavebalance_Employee"
if ($result) { $successCount++ } else { $failCount++ }

# ─────────────────────────────────────────────────────────────
# PART 2: Custom Status Codes for Leave Request
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "--- PART 2: Custom Status Codes ---" -ForegroundColor Cyan
Write-Host ""

# Rename existing statuses
Rename-StatusReason -BaseUrl $EnvironmentUrl -Token $token `
    -EntityLogicalName "lm_leaverequest" -Value 1 -NewLabel "Pending"

Rename-StatusReason -BaseUrl $EnvironmentUrl -Token $token `
    -EntityLogicalName "lm_leaverequest" -Value 2 -NewLabel "Cancelled"

# Add new status reasons under Active state (statecode=0)
$approvedValue = Add-StatusReason -BaseUrl $EnvironmentUrl -Token $token `
    -EntityLogicalName "lm_leaverequest" -StateCode 0 -Value 100000000 -Label "Approved"

$rejectedValue = Add-StatusReason -BaseUrl $EnvironmentUrl -Token $token `
    -EntityLogicalName "lm_leaverequest" -StateCode 0 -Value 100000001 -Label "Rejected"

# ─────────────────────────────────────────────────────────────
# PART 3: Publish Customizations
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "--- PART 3: Publishing ---" -ForegroundColor Cyan
Write-Host ""

Write-Info "Publishing all customizations..."
$headers = Get-Headers -Token $token
try {
    $publishBody = @{
        ParameterXml = "<importexportxml><entities><entity>lm_leaverequest</entity><entity>lm_leavebalance</entity></entities></importexportxml>"
    } | ConvertTo-Json -Compress

    Invoke-RestMethod `
        -Uri "$EnvironmentUrl/api/data/v9.2/PublishXml" `
        -Method Post `
        -Headers $headers `
        -Body $publishBody `
        -ContentType "application/json; charset=utf-8"
    Write-Success "Published customizations"
}
catch {
    Write-Warn "Publish may have failed: $($_.Exception.Message)"
}

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  Results: $successCount lookups created, $failCount failed" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
if ($approvedValue) {
    Write-Host "  Status codes: Pending(1), Approved($approvedValue), Rejected($rejectedValue), Cancelled(2)" -ForegroundColor Cyan
} else {
    Write-Host "  Status codes: Check above for actual values assigned by Dataverse" -ForegroundColor Yellow
}
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. pac code add-data-source -a dataverse -t lm_leaverequest"
Write-Host "2. pac code add-data-source -a dataverse -t lm_leavebalance"
Write-Host "3. Update DataverseAdapter.ts with the actual statuscode values"
Write-Host ""

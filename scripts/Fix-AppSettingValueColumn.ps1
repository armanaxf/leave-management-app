<#
.SYNOPSIS
    Fixes the lm_value column on lm_appsetting table to be Memo type instead of String

.DESCRIPTION
    The lm_value column was created as StringType (maxLength 500) but needs to be
    MemoType (maxLength 100000) to store large values like base64 encoded images.

    Dataverse does not allow in-place type changes, so this script:
    1. Deletes the existing lm_value column
    2. Recreates it as MemoAttributeMetadata

.NOTES
    WARNING: This will delete all existing setting values. Re-save settings after running.
    Prerequisites: Install-Module -Name MSAL.PS -Scope CurrentUser
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
        exit 1
    }
}

# Get access token using MSAL
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
            -DeviceCode `
            -ErrorAction Stop

        Write-Host "[OK] Got token via device code flow" -ForegroundColor Green
        return $tokenResponse.AccessToken
    }
    catch {
        throw "Failed to get access token. Install MSAL.PS: Install-Module MSAL.PS -Scope CurrentUser"
    }
}

$headers = $null

function Get-Headers {
    param([string]$Token)
    return @{
        "Authorization" = "Bearer $Token"
        "Content-Type"  = "application/json"
        "OData-MaxVersion" = "4.0"
        "OData-Version" = "4.0"
    }
}

# Main execution
Write-Host ""
Write-Host "================================================" -ForegroundColor Magenta
Write-Host "  Fix App Setting Value Column" -ForegroundColor Magenta
Write-Host "  StringType (500) -> MemoType (100000)" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta
Write-Host ""

$token = Get-DataverseToken -ResourceUrl $EnvironmentUrl
$headers = Get-Headers -Token $token

# Step 1: Check if lm_value column exists and what type it is
Write-Host "[..] Checking existing lm_value column..." -ForegroundColor Cyan
$columnExists = $false
$columnIsMemo = $false

try {
    $attrMeta = Invoke-RestMethod `
        -Uri "$EnvironmentUrl/api/data/v9.2/EntityDefinitions(LogicalName='lm_appsetting')/Attributes(LogicalName='lm_value')?`$select=AttributeType,MaxLength,SchemaName" `
        -Method Get `
        -Headers $headers
    $columnExists = $true
    $attrType = $attrMeta.AttributeType
    $maxLen = $attrMeta.MaxLength
    Write-Host "[OK] Found lm_value: Type=$attrType, MaxLength=$maxLen" -ForegroundColor Green

    if ($attrType -eq "Memo") {
        $columnIsMemo = $true
        Write-Host "[OK] Column is already MemoType - no changes needed!" -ForegroundColor Green
    }
}
catch {
    Write-Host "[!!] lm_value column not found - will create fresh" -ForegroundColor Yellow
}

# Step 1b: Delete existing column if it's not already Memo
if ($columnExists -and -not $columnIsMemo) {
    Write-Host "[..] Deleting existing StringType lm_value column..." -ForegroundColor Cyan
    try {
        Invoke-RestMethod `
            -Uri "$EnvironmentUrl/api/data/v9.2/EntityDefinitions(LogicalName='lm_appsetting')/Attributes(LogicalName='lm_value')" `
            -Method Delete `
            -Headers $headers
        Write-Host "[OK] Deleted lm_value column" -ForegroundColor Green
        $columnExists = $false
    }
    catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        Write-Host "[XX] Failed to delete: $($_.Exception.Message)" -ForegroundColor Red
        if ($errorDetails) { Write-Host "[XX] Details: $($errorDetails.error.message)" -ForegroundColor Red }
        exit 1
    }
}

if ($columnIsMemo) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  No changes needed - lm_value is already MemoType" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    exit 0
}

# Step 2: Recreate as Memo type
Write-Host "[..] Creating lm_value as MemoType (maxLength 100000)..." -ForegroundColor Cyan

$memoColumn = @{
    "@odata.type" = "Microsoft.Dynamics.CRM.MemoAttributeMetadata"
    SchemaName = "lm_value"
    MaxLength = 100000
    FormatName = @{ Value = "TextArea" }
    RequiredLevel = @{ Value = "None" }
    DisplayName = @{
        "@odata.type" = "Microsoft.Dynamics.CRM.Label"
        LocalizedLabels = @(
            @{ "@odata.type" = "Microsoft.Dynamics.CRM.LocalizedLabel"; Label = "Value"; LanguageCode = 1033 }
        )
    }
} | ConvertTo-Json -Depth 10 -Compress

try {
    Invoke-RestMethod `
        -Uri "$EnvironmentUrl/api/data/v9.2/EntityDefinitions(LogicalName='lm_appsetting')/Attributes" `
        -Method Post `
        -Headers $headers `
        -Body $memoColumn `
        -ContentType "application/json; charset=utf-8"
    Write-Host "[OK] Created lm_value as MemoType" -ForegroundColor Green
}
catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    Write-Host "[XX] Failed to create: $($_.Exception.Message)" -ForegroundColor Red
    if ($errorDetails) { Write-Host "[XX] Details: $($errorDetails.error.message)" -ForegroundColor Red }
    exit 1
}

# Step 3: Publish customizations
Write-Host "[..] Publishing customizations..." -ForegroundColor Cyan
try {
    $publishBody = @{
        ParameterXml = "<importexportxml><entities><entity>lm_appsetting</entity></entities></importexportxml>"
    } | ConvertTo-Json -Compress

    Invoke-RestMethod `
        -Uri "$EnvironmentUrl/api/data/v9.2/PublishXml" `
        -Method Post `
        -Headers $headers `
        -Body $publishBody `
        -ContentType "application/json; charset=utf-8"
    Write-Host "[OK] Published customizations" -ForegroundColor Green
}
catch {
    Write-Host "[!!] Publish may have failed (non-critical): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Done! lm_value is now MemoType (100K chars)" -ForegroundColor Green
Write-Host "  Next: pac code add-data-source -a dataverse -t lm_appsetting" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Green

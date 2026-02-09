# Setup-Lookups.ps1
# Creates the missing Lookup columns for Leave Requests in Dataverse
# Uses Microsoft.Xrm.Data.PowerShell module SDK explicitly

$ErrorActionPreference = "Stop"

function Load-XrmTooling {
    Write-Host "Checking for Microsoft.Xrm.Data.PowerShell module..." -ForegroundColor Cyan
    if (-not (Get-Module -ListAvailable -Name Microsoft.Xrm.Data.PowerShell)) {
        Write-Host "Module not found. Installing..." -ForegroundColor Yellow
        Install-Module -Name Microsoft.Xrm.Data.PowerShell -Scope CurrentUser -Force -AllowClobber
    }
    Import-Module Microsoft.Xrm.Data.PowerShell -ErrorAction SilentlyContinue
    
    # Load Assemblies using Reflection to likely bypass loader context issues
    $module = Get-Module Microsoft.Xrm.Data.PowerShell
    if (-not $module) { Import-Module Microsoft.Xrm.Data.PowerShell; $module = Get-Module Microsoft.Xrm.Data.PowerShell }
    
    $basePath = $module.ModuleBase
    Write-Host "Module Path: $basePath" -ForegroundColor Gray

    # Helper to load DLL via Reflection
    function Load-Dll([string]$name) {
        $path = Join-Path $basePath $name
        if (Test-Path $path) {
            try {
                [System.Reflection.Assembly]::LoadFrom($path) | Out-Null
                Write-Host "Loaded $name" -ForegroundColor Gray
            } catch {
                Write-Host "Failed to load $name : $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "Warning: $name not found at $path" -ForegroundColor Yellow
        }
    }

    # Load Dependencies in Order
    # Newer builds of Xrm.Data.PowerShell include System.Text.Json etc.
    Load-Dll "System.Runtime.CompilerServices.Unsafe.dll"
    Load-Dll "System.Buffers.dll"
    Load-Dll "System.Memory.dll"
    Load-Dll "System.Numerics.Vectors.dll"
    Load-Dll "System.Text.Encodings.Web.dll"
    Load-Dll "System.Text.Json.dll"
    Load-Dll "System.Threading.Tasks.Extensions.dll"
    Load-Dll "System.ValueTuple.dll"
    
    # Load SDK
    Load-Dll "Microsoft.Xrm.Sdk.dll"
    Load-Dll "Microsoft.Crm.Sdk.Proxy.dll"
    
    Write-Host "Assemblies loaded." -ForegroundColor Green
}

function Connect-Dataverse {
    $ServerUrl = "https://org53e499d9.crm11.dynamics.com/"
    Write-Host "Connecting to $ServerUrl ..." -ForegroundColor Cyan
    
    # ForceOAuth usually prompts for interactive login if needed
    $conn = Connect-CrmOnline -ServerUrl $ServerUrl -ForceOAuth
    
    if (-not $conn.IsReady) {
        throw "Failed to connect to Dataverse. Please check your credentials."
    }
    Write-Host "Connected to $($conn.ConnectedOrgFriendlyName)" -ForegroundColor Green
    return $conn
}

function Create-Lookup {
    param(
        [Parameter(Mandatory=$true)] $Conn,
        [Parameter(Mandatory=$true)] $EntityName,
        [Parameter(Mandatory=$true)] $AttributeName,
        [Parameter(Mandatory=$true)] $DisplayName,
        [Parameter(Mandatory=$true)] $TargetEntity
    )

    try {
        Write-Host "Processing '$AttributeName' on '$EntityName'..." -ForegroundColor Cyan
        
        # Check if attribute exists using Get-CrmEntityAttribute which is standard in module
        # Note: Get-CrmEntityAttribute returns object or throws/null
        try {
            # Try to fetch existing attribute manually or ignore check and catch create error
            # We'll rely on create error for simplicity as Get-CrmEntityAttribute signatures vary
        } catch {}

        # Create Lookup Attribute Metadata
        $lookup = New-Object Microsoft.Xrm.Sdk.Metadata.LookupAttributeMetadata
        $lookup.SchemaName = $AttributeName
        $lookup.DisplayName = New-Object Microsoft.Xrm.Sdk.Label -ArgumentList $DisplayName, 1033
        $lookup.RequiredLevel = New-Object Microsoft.Xrm.Sdk.Metadata.AttributeRequiredLevelManaged([Microsoft.Xrm.Sdk.Metadata.AttributeRequiredLevel]::None)
        
        # Unique Relationship Name
        $relName = "${EntityName}_${TargetEntity}_${AttributeName}" -replace "[^a-zA-Z0-9_]",""
        
        # Create OneToMany Request
        $otmRequest = New-Object Microsoft.Xrm.Sdk.Messages.CreateOneToManyRequest
        $otmRequest.Lookup = $lookup
        $otmRequest.OneToManyRelationship = New-Object Microsoft.Xrm.Sdk.Metadata.OneToManyRelationshipMetadata
        $otmRequest.OneToManyRelationship.ReferencedEntity = $TargetEntity
        $otmRequest.OneToManyRelationship.ReferencingEntity = $EntityName
        $otmRequest.OneToManyRelationship.SchemaName = $relName
        
        # Execute Request
        try {
            $resp = $Conn.Execute($otmRequest)
            Write-Host "Created '$AttributeName' successfully." -ForegroundColor Green
        }
        catch {
             if ($_.Exception.Message -like "*already exists*") {
                 Write-Host "Attribute '$AttributeName' already exists. Skipping." -ForegroundColor Yellow
             }
             else {
                 throw $_
             }
        }
    }
    catch {
        Write-Host "Failed to create '$AttributeName': $($_.Exception.Message)" -ForegroundColor Red
    }
}

# --- Main Script ---

try {
    Load-XrmTooling
    $conn = Connect-Dataverse

    # 1. Leave Type Lookup on Leave Request
    # Must explicitly pass $conn to parameter Conn
    Create-Lookup -Conn $conn -EntityName "lm_leaverequests" -AttributeName "lm_LeaveType" -DisplayName "Leave Type" -TargetEntity "lm_leavetypes"

    # 2. Employee Lookup on Leave Request
    Create-Lookup -Conn $conn -EntityName "lm_leaverequests" -AttributeName "lm_Employee" -DisplayName "Employee" -TargetEntity "systemuser"

    Write-Host "Publishing changes..." -ForegroundColor Cyan
    Publish-CrmAllCustomization
    Write-Host "Done! Columns created/verified." -ForegroundColor Green
}
catch {
    Write-Host "Script failed: $($_.Exception.Message)" -ForegroundColor Red
}

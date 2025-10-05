# Script to verify SonarQube authentication
Write-Host "=== SonarQube Authentication Verification ===" -ForegroundColor Cyan

# Function to test authentication
function Test-SonarAuth {
    param(
        [string]$username,
        [string]$password
    )
    
    $creds = "${username}:${password}"
    $encodedCreds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($creds))
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:9000/api/authentication/validate" -Method Get -Headers @{ Authorization = "Basic $encodedCreds" }
        return $true
    } catch {
        return $false
    }
}

# Verify SonarQube status
Write-Host "1. Verifying SonarQube status..." -ForegroundColor Yellow
try {
    $systemStatus = Invoke-RestMethod -Uri "http://localhost:9000/api/system/status" -Method Get
    Write-Host "System status: $($systemStatus.status)" -ForegroundColor Green
} catch {
    Write-Host "Error verifying status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test different credential combinations
$credentialsToTest = @(
    @{ username = "admin"; password = "admin" },
    @{ username = "admin"; password = "" }
)

Write-Host "2. Testing credentials..." -ForegroundColor Yellow
$validCreds = $null

foreach ($cred in $credentialsToTest) {
    Write-Host "   Testing: $($cred.username)/$($cred.password)" -ForegroundColor Gray
    if (Test-SonarAuth -username $cred.username -password $cred.password) {
        Write-Host "   Valid credentials found!" -ForegroundColor Green
        $validCreds = $cred
        break
    } else {
        Write-Host "   Invalid credentials" -ForegroundColor Red
    }
}

if ($validCreds) {
    Write-Host "3. Getting projects..." -ForegroundColor Yellow
    
    $creds = "$($validCreds.username):$($validCreds.password)"
    $encodedCreds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($creds))
    
    try {
        $projects = Invoke-RestMethod -Uri "http://localhost:9000/api/projects/search" -Method Get -Headers @{ Authorization = "Basic $encodedCreds" }
        Write-Host "Total projects: $($projects.paging.total)" -ForegroundColor Green
        
        if ($projects.paging.total -eq 0) {
            Write-Host "No projects configured in SonarQube." -ForegroundColor Yellow
        } else {
            Write-Host "Projects found:" -ForegroundColor Cyan
            $projects.components | Format-Table -Property key, name, qualifier, lastAnalysisDate -AutoSize
        }
    } catch {
        Write-Host "Error getting projects: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "3. No valid credentials found." -ForegroundColor Red
    Write-Host "Go to http://localhost:9000 to complete initial setup" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Verification completed ===" -ForegroundColor Cyan
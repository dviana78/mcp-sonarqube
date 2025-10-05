# Final validation script - All violations in English
Write-Host "SONARQUBE QUALITY GATE - FINAL STATUS CHECK" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

$creds = "admin:DVS.1978.ygl"
$encodedCreds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($creds))

Write-Host ""
Write-Host "1. Checking SonarQube server status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "http://localhost:9000/api/system/status" -Method Get
    Write-Host "   Server Status: $($status.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Cannot connect to SonarQube" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Checking MCP Server status..." -ForegroundColor Yellow
try {
    $mcpHealth = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method Get
    Write-Host "   MCP Server: $($mcpHealth.status)" -ForegroundColor Green
    Write-Host "   SonarQube Connection: $($mcpHealth.sonarqube.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Cannot connect to MCP Server" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Getting current Quality Gate status..." -ForegroundColor Yellow
try {
    $qualityGate = Invoke-RestMethod -Uri "http://localhost:9000/api/qualitygates/project_status?projectKey=azure-apim-mcp-server" -Method Get -Headers @{ Authorization = "Basic $encodedCreds" }
    $status = $qualityGate.projectStatus.status
    $color = if ($status -eq "OK") { "Green" } else { "Red" }
    Write-Host "   Quality Gate Status: $status" -ForegroundColor $color
    
    if ($status -eq "ERROR") {
        Write-Host ""
        Write-Host "VIOLATIONS TO RESOLVE:" -ForegroundColor Red
        Write-Host "=====================" -ForegroundColor Red
        
        # Get new violations
        $newIssues = Invoke-RestMethod -Uri "http://localhost:9000/api/issues/search?componentKeys=azure-apim-mcp-server&createdAfter=2025-10-05&ps=5" -Method Get -Headers @{ Authorization = "Basic $encodedCreds" }
        
        if ($newIssues.issues.Count -gt 0) {
            $newIssues.issues | Select-Object -First 3 | ForEach-Object {
                Write-Host ""
                Write-Host "FILE: $($_.component -replace 'azure-apim-mcp-server:', '')" -ForegroundColor Cyan
                Write-Host "LINE: $($_.line)" -ForegroundColor White
                Write-Host "SEVERITY: $($_.severity)" -ForegroundColor $(if($_.severity -eq 'CRITICAL') {'Red'} elseif($_.severity -eq 'MAJOR') {'Yellow'} else {'White'})
                Write-Host "PROBLEM: $($_.message)" -ForegroundColor White
                Write-Host "RULE: $($_.rule)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host ""
        Write-Host "CONGRATULATIONS! Quality Gate is passing!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ERROR: Cannot get Quality Gate status" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Project analysis summary..." -ForegroundColor Yellow
try {
    $projects = Invoke-RestMethod -Uri "http://localhost:8080/projects" -Method Get
    Write-Host "   Total projects: $($projects.total)" -ForegroundColor Green
    
    if ($projects.total -gt 0) {
        $projects.projects | ForEach-Object {
            Write-Host "   - $($_.name) (Key: $($_.key))" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "   ERROR: Cannot get projects via MCP" -ForegroundColor Red
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "ALL SYSTEMS CHECKED - READY FOR DEVELOPMENT!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
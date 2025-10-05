# Script to analyze specific SonarQube violations
Write-Host "VIOLATION ANALYZER - QUALITY GATE FIX" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$creds = "admin:DVS.1978.ygl"
$encodedCreds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($creds))
$headers = @{ Authorization = "Basic $encodedCreds" }

function Get-ViolationDetails {
    param([string]$component, [string]$rule, [string]$description)
    
    Write-Host ""
    Write-Host "ANALYZING: $description" -ForegroundColor Yellow
    Write-Host ("=" * 50) -ForegroundColor Yellow
    
    try {
        $issues = Invoke-RestMethod -Uri "http://localhost:9000/api/issues/search?componentKeys=azure-apim-mcp-server`&rules=$rule`&ps=10" -Method Get -Headers $headers
        
        if ($issues.issues.Count -gt 0) {
            $issues.issues | ForEach-Object {
                Write-Host "File: $($_.component -replace 'azure-apim-mcp-server:', '')" -ForegroundColor Cyan
                Write-Host "Line: $($_.line)" -ForegroundColor White
                Write-Host "Problem: $($_.message)" -ForegroundColor Red
                Write-Host "Severity: $($_.severity)" -ForegroundColor $(if($_.severity -eq 'CRITICAL') {'Red'} elseif($_.severity -eq 'MAJOR') {'Yellow'} else {'White'})
                
                # Try to get code context
                if ($_.line) {
                    try {
                        $fromLine = [Math]::Max(1, $_.line - 3)
                        $toLine = $_.line + 3
                        $sourceCode = Invoke-RestMethod -Uri "http://localhost:9000/api/sources/show?key=$($_.component)`&from=$fromLine`&to=$toLine" -Method Get -Headers $headers
                        
                        Write-Host ""
                        Write-Host "CODE CONTEXT:" -ForegroundColor Gray
                        $sourceCode.sources | ForEach-Object {
                            $prefix = if ($_.line -eq $issues.issues[0].line) { ">>> " } else { "    " }
                            $color = if ($_.line -eq $issues.issues[0].line) { "Red" } else { "Gray" }
                            Write-Host "$prefix$($_.line): $($_.code)" -ForegroundColor $color
                        }
                    } catch {
                        Write-Host "Could not get code context" -ForegroundColor Yellow
                    }
                }
                Write-Host ""
            }
        } else {
            Write-Host "No violations found for this rule" -ForegroundColor Green
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Analyze each specific violation
Get-ViolationDetails -rule "typescript:S3776" -description "HIGH COGNITIVE COMPLEXITY"
Get-ViolationDetails -rule "typescript:S6397" -description "UNNECESSARY CHARACTER CLASS"
Get-ViolationDetails -rule "typescript:S6353" -description "VERBOSE REGEX SYNTAX"

Write-Host ""
Write-Host "SUMMARY OF REQUIRED ACTIONS:" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "1. CRITICAL: Refactor function with complexity 26 to ≤15" -ForegroundColor Red
Write-Host "2. MAJOR: Simplify regex [x] to x" -ForegroundColor Yellow  
Write-Host "3. MINOR: Change [a-zA-Z0-9_] to \w" -ForegroundColor White
Write-Host ""
Write-Host "Once these 3 violations are resolved, Quality Gate will be OK" -ForegroundColor Green
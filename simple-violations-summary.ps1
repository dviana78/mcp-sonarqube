# Simplified script to get specific violations
$creds = "admin:DVS.1978.ygl"
$encodedCreds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($creds))

Write-Host "VIOLATIONS TO RESOLVE FOR QUALITY GATE PASS:" -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red

Write-Host ""
Write-Host "CRITICAL VIOLATION 1:" -ForegroundColor Red
Write-Host "File: src/services/grpc.service.ts (line 442)" -ForegroundColor Cyan
Write-Host "Problem: Cognitive complexity 26 > 15 allowed" -ForegroundColor White
Write-Host "Solution: Refactor function by dividing into smaller functions" -ForegroundColor Green

Write-Host ""
Write-Host "MAJOR VIOLATION 2:" -ForegroundColor Yellow  
Write-Host "File: src/services/api-management.service.ts (line 144)" -ForegroundColor Cyan
Write-Host "Problem: Regex with unnecessary character class" -ForegroundColor White
Write-Host "Solution: Change [x] to x directly" -ForegroundColor Green

Write-Host ""
Write-Host "MINOR VIOLATION 3:" -ForegroundColor White
Write-Host "File: src/services/api-management.service.ts" -ForegroundColor Cyan  
Write-Host "Problem: Using [a-zA-Z0-9_] instead of \\w" -ForegroundColor White
Write-Host "Solution: Replace [a-zA-Z0-9_] with \\w" -ForegroundColor Green

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Open file src/services/api-management.service.ts" -ForegroundColor White
Write-Host "2. Go to line 144 and fix regex" -ForegroundColor White  
Write-Host "3. Search for [a-zA-Z0-9_] and replace with \\w" -ForegroundColor White
Write-Host "4. Open src/services/grpc.service.ts line 442" -ForegroundColor White
Write-Host "5. Refactor complex function" -ForegroundColor White

Write-Host ""
Write-Host "Expected result: Quality Gate ERROR -> OK" -ForegroundColor Green
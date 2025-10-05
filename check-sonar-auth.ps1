# Script para verificar y configurar la autenticación de SonarQube
Write-Host "=== Verificación de autenticación SonarQube ===" -ForegroundColor Cyan

# Función para probar autenticación
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

# Función para obtener proyectos
function Get-SonarProjects {
    param(
        [string]$username,
        [string]$password
    )
    
    $creds = "${username}:${password}"
    $encodedCreds = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($creds))
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:9000/api/projects/search" -Method Get -Headers @{ Authorization = "Basic $encodedCreds" }
        return $response
    } catch {
        Write-Host "Error al obtener proyectos: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Verificar estado de SonarQube
Write-Host "1. Verificando estado de SonarQube..." -ForegroundColor Yellow
try {
    $systemStatus = Invoke-RestMethod -Uri "http://localhost:9000/api/system/status" -Method Get
    Write-Host "Estado del sistema: $($systemStatus.status)" -ForegroundColor Green
} catch {
    Write-Host "Error al verificar estado: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verificar si requiere setup inicial
Write-Host "2. Verificando si requiere setup inicial..." -ForegroundColor Yellow
try {
    $dbMigration = Invoke-RestMethod -Uri "http://localhost:9000/api/system/db_migration_status" -Method Get
    Write-Host "Estado de migración DB: $($dbMigration.state)" -ForegroundColor Green
} catch {
    Write-Host "Error al verificar migración: $($_.Exception.Message)" -ForegroundColor Red
}

# Probar diferentes combinaciones de credenciales
$credentialsToTest = @(
    @{ username = "admin"; password = "admin" },
    @{ username = "admin"; password = "" },
    @{ username = ""; password = "" }
)

Write-Host "3. Probando credenciales..." -ForegroundColor Yellow
$validCreds = $null

foreach ($cred in $credentialsToTest) {
    Write-Host "   Probando: $($cred.username)/$($cred.password)" -ForegroundColor Gray
    if (Test-SonarAuth -username $cred.username -password $cred.password) {
        Write-Host "   ✓ Credenciales válidas encontradas!" -ForegroundColor Green
        $validCreds = $cred
        break
    } else {
        Write-Host "   ✗ Credenciales inválidas" -ForegroundColor Red
    }
}

if ($validCreds) {
    Write-Host "4. Obteniendo proyectos..." -ForegroundColor Yellow
    $projects = Get-SonarProjects -username $validCreds.username -password $validCreds.password
    
    if ($projects) {
        Write-Host "Total de proyectos: $($projects.paging.total)" -ForegroundColor Green
        
        if ($projects.paging.total -eq 0) {
            Write-Host "No hay proyectos configurados en SonarQube." -ForegroundColor Yellow
            Write-Host "Para añadir un proyecto, puedes:" -ForegroundColor Cyan
            Write-Host "  1. Ir a http://localhost:9000" -ForegroundColor White
            Write-Host "  2. Hacer login con las credenciales válidas" -ForegroundColor White
            Write-Host "  3. Crear un nuevo proyecto manualmente" -ForegroundColor White
        } else {
            Write-Host "Proyectos encontrados:" -ForegroundColor Cyan
            $projects.components | Format-Table -Property key, name, qualifier, lastAnalysisDate -AutoSize
        }
    }
} else {
    Write-Host "4. No se encontraron credenciales válidas." -ForegroundColor Red
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "  1. Ir a http://localhost:9000 y completar el setup inicial" -ForegroundColor White
    Write-Host "  2. Cambiar la contraseña por defecto si es requerido" -ForegroundColor White
    Write-Host "  3. Crear un token de acceso en las configuraciones de usuario" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Verificacion completada ===" -ForegroundColor Cyan
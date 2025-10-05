# PowerShell script to start SonarQube Docker Setup

Write-Host "Starting SonarQube for TypeScript/Node.js projects..." -ForegroundColor Green
Write-Host

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: docker-compose is not installed. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Check if SonarQube container already exists and is running
Write-Host "Checking SonarQube container status..." -ForegroundColor Yellow

$containerStatus = docker ps -a --filter "name=sonarqube" --format "{{.Status}}" 2>$null
$containerRunning = docker ps --filter "name=sonarqube" --format "{{.Names}}" 2>$null

if ($containerRunning -eq "sonarqube") {
    Write-Host "SUCCESS: SonarQube container is already running!" -ForegroundColor Green
    Write-Host "Container status: $containerStatus" -ForegroundColor Cyan
    Write-Host
    Write-Host "Access SonarQube at: http://localhost:9000" -ForegroundColor Cyan
    Write-Host "Default credentials:" -ForegroundColor White
    Write-Host "   Username: admin"
    Write-Host "   Password: admin"
    Write-Host
    Write-Host "If you need to restart the container, run: docker-compose restart" -ForegroundColor Yellow
    exit 0
}
elseif ($containerStatus -like "*Exited*") {
    Write-Host "SonarQube container exists but is stopped. Starting existing container..." -ForegroundColor Yellow
    docker-compose start
}
else {
    Write-Host "Creating and starting new SonarQube container..." -ForegroundColor Yellow
    docker-compose up -d
}

Write-Host
Write-Host "Waiting for SonarQube to start (this may take a few minutes)..." -ForegroundColor Yellow

# Wait for SonarQube to be ready
$timeout = 300
$counter = 0

while ($counter -lt $timeout) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:9000/api/system/status" -TimeoutSec 5
        if ($response.status -eq "UP") {
            Write-Host "SUCCESS: SonarQube is ready!" -ForegroundColor Green
            Write-Host
            Write-Host "Access SonarQube at: http://localhost:9000" -ForegroundColor Cyan
            Write-Host "Default credentials:" -ForegroundColor White
            Write-Host "   Username: admin"
            Write-Host "   Password: admin"
            Write-Host
            Write-Host "WARNING: Remember to change the default password on first login!" -ForegroundColor Yellow
            Write-Host
            Write-Host "See README.md for configuration instructions." -ForegroundColor Cyan
            exit 0
        }
    } catch {
        # Service not ready yet, continue waiting
    }
    
    if ($counter % 30 -eq 0) {
        Write-Host "   Still waiting... ($counter seconds elapsed)"
    }
    
    Start-Sleep -Seconds 5
    $counter += 5
}

Write-Host "WARNING: SonarQube is taking longer than expected to start." -ForegroundColor Yellow
Write-Host "Check the logs with: docker-compose logs -f sonarqube" -ForegroundColor Cyan
Write-Host "Try accessing: http://localhost:9000" -ForegroundColor Cyan
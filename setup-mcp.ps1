# PowerShell setup script for SonarQube MCP Server

Write-Host "🚀 Setting up SonarQube MCP Server..." -ForegroundColor Green
Write-Host

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose is not installed. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing MCP Server dependencies..." -ForegroundColor Yellow
Set-Location mcp-server

# Install dependencies
npm install

Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MCP Server built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "🐳 Building Docker containers..." -ForegroundColor Yellow
docker-compose build

Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow

# Wait for SonarQube
$timeout = 300
$counter = 0

while ($counter -lt $timeout) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:9000/api/system/status" -TimeoutSec 5
        if ($response.status -eq "UP") {
            Write-Host "✅ SonarQube is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Service not ready yet, continue waiting
    }
    
    if ($counter % 30 -eq 0) {
        Write-Host "   Still waiting for SonarQube... ($counter seconds elapsed)"
    }
    
    Start-Sleep -Seconds 5
    $counter += 5
}

# Wait for MCP Server
Start-Sleep -Seconds 10
$mcpLogs = docker-compose logs mcp-server
if ($mcpLogs -match "MCP Server running") {
    Write-Host "✅ MCP Server is ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️  MCP Server may still be starting. Check logs with: docker-compose logs mcp-server" -ForegroundColor Yellow
}

Write-Host
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host
Write-Host "🌐 SonarQube Web UI: " -ForegroundColor Cyan -NoNewline
Write-Host "http://localhost:9000" -ForegroundColor White
Write-Host "🔧 MCP Server: " -ForegroundColor Cyan -NoNewline
Write-Host "Running on port 8080" -ForegroundColor White
Write-Host "👤 Default credentials: " -ForegroundColor Cyan -NoNewline
Write-Host "admin/admin" -ForegroundColor White
Write-Host
Write-Host "📖 Next steps:" -ForegroundColor Cyan
Write-Host "1. Change default password at http://localhost:9000"
Write-Host "2. Configure your IDE with MCP Server"
Write-Host "3. Copy sonar-project.properties to your TypeScript project"
Write-Host "4. Run: sonar-scanner"
Write-Host
Write-Host "🆘 Need help? Check README.md or run: docker-compose logs" -ForegroundColor Yellow
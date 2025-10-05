#!/bin/bash
# Setup script for SonarQube MCP Server

echo "🚀 Setting up SonarQube MCP Server..."
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "📦 Installing MCP Server dependencies..."
cd mcp-server

# Install dependencies
npm install

echo "🔨 Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ MCP Server built successfully!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

cd ..

echo "🐳 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo
echo "⏳ Waiting for services to be ready..."

# Wait for SonarQube
timeout=300
counter=0
while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:9000/api/system/status | grep -q '"status":"UP"'; then
        echo "✅ SonarQube is ready!"
        break
    fi
    
    if [ $((counter % 30)) -eq 0 ]; then
        echo "   Still waiting for SonarQube... ($counter seconds elapsed)"
    fi
    
    sleep 5
    counter=$((counter + 5))
done

# Wait for MCP Server
sleep 10
if docker-compose logs mcp-server | grep -q "MCP Server running"; then
    echo "✅ MCP Server is ready!"
else
    echo "⚠️  MCP Server may still be starting. Check logs with: docker-compose logs mcp-server"
fi

echo
echo "🎉 Setup complete!"
echo
echo "🌐 SonarQube Web UI: http://localhost:9000"
echo "🔧 MCP Server: Running on port 8080"
echo "👤 Default credentials: admin/admin"
echo
echo "📖 Next steps:"
echo "1. Change default password at http://localhost:9000"
echo "2. Configure your IDE with MCP Server"
echo "3. Copy sonar-project.properties to your TypeScript project"
echo "4. Run: sonar-scanner"
echo
echo "🆘 Need help? Check README.md or run: docker-compose logs"
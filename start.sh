#!/bin/bash
# Start SonarQube Docker Setup

echo "🚀 Starting SonarQube for TypeScript/Node.js projects..."
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

echo "📦 Building and starting containers..."
docker-compose up -d

echo
echo "⏳ Waiting for SonarQube to start (this may take a few minutes)..."

# Wait for SonarQube to be ready
timeout=300
counter=0
while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:9000/api/system/status | grep -q '"status":"UP"'; then
        echo "✅ SonarQube is ready!"
        echo
        echo "🌐 Access SonarQube at: http://localhost:9000"
        echo "👤 Default credentials:"
        echo "   Username: admin"
        echo "   Password: admin"
        echo
        echo "⚠️  Remember to change the default password on first login!"
        echo
        echo "📖 See README.md for configuration instructions."
        exit 0
    fi
    
    if [ $((counter % 30)) -eq 0 ]; then
        echo "   Still waiting... ($counter seconds elapsed)"
    fi
    
    sleep 5
    counter=$((counter + 5))
done

echo "⚠️  SonarQube is taking longer than expected to start."
echo "📋 Check the logs with: docker-compose logs -f sonarqube"
echo "🌐 Try accessing: http://localhost:9000"
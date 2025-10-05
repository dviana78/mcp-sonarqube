# SonarQube MCP Server

A Model Context Protocol (MCP) server that provides complete integration with SonarQube for TypeScript/Node.js code analysis.

## 🚀 Features

- **Complete SonarQube Integration**: Access to all main APIs
- **TypeScript/Node.js Optimized**: Pre-configured for ES Modules projects
- **MCP Tools**: 10+ tools for code analysis and metrics
- **Informative Resources**: Configurations, guides, and documentation
- **Dockerized**: Easy deployment with Docker Compose
- **Real-time**: Direct access to quality metrics, issues, and coverage

## 📋 Available MCP Tools

### 1. **System and Status**
- `health_check` - Verify SonarQube server health
- `get_system_status` - Get server status and version

### 2. **Project Management**
- `list_projects` - List all projects
- `get_project` - Get specific project details
- `generate_project_report` - Generate comprehensive project report

### 3. **Quality Analysis**
- `get_project_issues` - Get issues with advanced filtering
- `get_quality_gate_status` - Quality gate status
- `get_code_quality_metrics` - Quality metrics (bugs, vulnerabilities, code smells)
- `get_code_coverage` - Code coverage metrics
- `get_analysis_history` - Analysis history

## 📚 Available MCP Resources

### 1. **Server Information**
- `sonarqube://server/info` - Current SonarQube server status

### 2. **Projects Overview**
- `sonarqube://projects/overview` - Summary of all projects with metrics

### 3. **Configuration**
- `sonarqube://config/typescript` - Configuration for TypeScript projects
- `sonarqube://setup/docker` - Docker setup instructions
- `sonarqube://quality-gates/list` - List of configured quality gates

## 🛠️ Installation and Configuration

### Prerequisites
- Docker Desktop
- Node.js ≥18.0.0 (for local development)

### 1. Docker Installation (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd sonarqube

# Build and run the complete stack
docker-compose up -d

# Verify that services are running
docker-compose ps
```

### 2. Local Installation (Development)

```bash
cd mcp-server

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run in development mode
npm run dev
```

## 🔧 Configuration

### Environment Variables

```bash
# SonarQube Configuration
SONARQUBE_URL=http://localhost:9000
SONARQUBE_USERNAME=admin
SONARQUBE_PASSWORD=admin
# Or use token instead of username/password
SONARQUBE_TOKEN=your_token_here

# MCP Server Configuration
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
```

### MCP Client Configuration

To use with Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "node",
      "args": ["/path/to/sonarqube/mcp-server/dist/index.js"],
      "env": {
        "SONARQUBE_URL": "http://localhost:9000",
        "SONARQUBE_USERNAME": "admin",
        "SONARQUBE_PASSWORD": "admin"
      }
    }
  }
}
```

## 🎯 Usage Examples

### 1. Check System Status

```bash
# Use the health_check tool
{
  "healthy": true,
  "timestamp": "2025-10-04T16:30:00.000Z"
}
```

### 2. Generate Project Report

```bash
# Use generate_project_report with projectKey
{
  "project": {
    "key": "my-typescript-project",
    "name": "My TypeScript Project",
    "lastAnalysisDate": "2025-10-04T15:30:00Z"
  },
  "qualityGate": {
    "status": "OK"
  },
  "metrics": {
    "quality": {
      "bugs": "0",
      "vulnerabilities": "0",
      "codeSmells": "12"
    },
    "coverage": {
      "lineCoverage": "85.5"
    }
  }
}
```

### 3. Get Project Issues

```bash
# Filter by MAJOR and CRITICAL severity
{
  "projectKey": "my-project",
  "severities": ["MAJOR", "CRITICAL"],
  "totalIssues": 5,
  "issues": [...]
}
```

## 🐳 Docker Commands

### Complete Stack Management

```bash
# Start SonarQube + MCP Server
docker-compose up -d

# Stop services
docker-compose down

# View MCP Server logs
docker-compose logs -f mcp-server

# View SonarQube logs
docker-compose logs -f sonarqube

# Rebuild MCP Server
docker-compose build mcp-server
docker-compose up -d mcp-server
```

### MCP Server Only

```bash
# Build MCP Server image
docker build -t sonarqube-mcp-server ./mcp-server

# Run MCP Server only
docker run -p 8080:8080 \
  -e SONARQUBE_URL=http://localhost:9000 \
  -e SONARQUBE_USERNAME=admin \
  -e SONARQUBE_PASSWORD=admin \
  sonarqube-mcp-server
```

## 🔍 TypeScript Projects Configuration

### 1. sonar-project.properties File

```properties
# Project identification
sonar.projectKey=my-typescript-project
sonar.projectName=My TypeScript Project
sonar.projectVersion=1.0

# Source code configuration
sonar.sources=src
sonar.tests=tests,test,spec,__tests__

# TypeScript specific
sonar.language=ts
sonar.typescript.node=18
sonar.typescript.tsconfigPath=tsconfig.json

# ES Modules
sonar.javascript.environments=node,es2022

# Coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### 2. Run Analysis

```bash
# 1. Install scanner
npm install -g sonarqube-scanner

# 2. Run tests with coverage
npm test -- --coverage

# 3. Run analysis
sonar-scanner
```

## 🔧 Development and Contributing

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── sonarqube-client.ts   # SonarQube API client
│   ├── tools/                # MCP tools
│   │   ├── index.ts
│   │   └── sonarqube-tools.ts
│   └── resources/            # MCP resources
│       └── index.ts
├── dist/                     # Compiled code
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Development Scripts

```bash
# Development with auto-reload
npm run dev

# Compile TypeScript
npm run build

# Run tests (if any)
npm test

# Clean build
npm run clean
```

## 🚨 Troubleshooting

### 1. MCP Server Cannot Connect to SonarQube

```bash
# Verify SonarQube is running
curl http://localhost:9000/api/system/status

# Check MCP Server logs
docker-compose logs mcp-server

# Check network connectivity
docker-compose exec mcp-server ping sonarqube
```

### 2. Authentication Errors

```bash
# Verify credentials
# Default user: admin/admin
# Change after first login

# Use token instead of username/password (recommended for production)
SONARQUBE_TOKEN=your_generated_token
```

### 3. TypeScript Compilation Issues

```bash
# Clean and rebuild
npm run clean
npm run build

# Check dependencies
npm install
```

## 📈 Metrics and Monitoring

The MCP Server provides access to:

- **Quality Metrics**: Bugs, vulnerabilities, code smells, duplication
- **Code Coverage**: Lines and branches covered
- **Quality Gates**: Status and conditions
- **Issues**: Filtered by severity, type, status
- **History**: Previous analysis and trends

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/new-functionality`)
3. Commit changes (`git commit -am 'Add new functionality'`)
4. Push to branch (`git push origin feature/new-functionality`)
5. Create Pull Request

## 📞 Support

- **Issues**: Report problems on GitHub Issues
- **Documentation**: This README and integrated MCP resources
- **SonarQube**: http://localhost:9000 (after Docker setup)
- **MCP Server**: Port 8080 (optional, for debugging)

---

🚀 **Your SonarQube MCP Server is ready to analyze TypeScript/Node.js projects!**
# SonarQube Docker Setup for TypeScript/Node.js Projects

This repository contains a complete Docker setup for running SonarQube with optimized configuration for TypeScript/Node.js projects using ES Modules, **plus an integrated MCP (Model Context Protocol) Server** for seamless AI assistant integration.

## Features

- ✅ SonarQube Community Edition 10
- ✅ PostgreSQL 15 database (or H2 for development)
- ✅ Pre-configured for TypeScript/Node.js ≥18.0.0
- ✅ ES Modules support
- ✅ Enhanced JavaScript/TypeScript analysis plugins
- ✅ Docker Compose for easy deployment
- ✅ Persistent data volumes
- 🆕 **MCP Server for AI Assistant Integration**
- 🆕 **10+ MCP Tools for Code Analysis**
- 🆕 **Real-time SonarQube Integration**

## Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose
- At least 4GB RAM available for containers
- Windows/Linux/macOS supported

## Quick Start

### 1. Start SonarQube + MCP Server

```powershell
# Clone or navigate to this directory
cd c:\projects\sonarqube

# Start all services (SonarQube + MCP Server)
docker-compose up -d

# Check logs (optional)
docker-compose logs -f sonarqube
docker-compose logs -f mcp-server
```

### 2. Access Services

- **SonarQube Web UI**: http://localhost:9000
- **MCP Server**: Port 8080 (for debugging)
- **Default credentials**: 
  - Username: `admin`
  - Password: `admin`

⚠️ **Important**: Change the default password on first login!

### 3. Configure Your TypeScript Project

#### Option A: Use the provided configuration file

Copy the `sonar-project.properties` file to your TypeScript project root and modify:

```properties
sonar.projectKey=your-project-key
sonar.projectName=Your Project Name
sonar.projectVersion=1.0
```

#### Option B: Install SonarQube Scanner

```powershell
# Install globally
npm install -g sonarqube-scanner

# Or install as dev dependency
npm install --save-dev sonarqube-scanner
```

### 4. Run Analysis

```powershell
# Navigate to your TypeScript project
cd path\to\your\typescript\project

# Run analysis (make sure sonar-project.properties is configured)
sonar-scanner

# Or if installed locally
npx sonar-scanner
```

## 🤖 MCP Server Integration

This setup includes a **Model Context Protocol (MCP) Server** that provides AI assistants with direct access to SonarQube data and analysis tools.

### MCP Features

- **10+ Analysis Tools**: Health checks, project reports, issue analysis, metrics
- **Real-time Data**: Direct API integration with SonarQube
- **TypeScript Optimized**: Pre-configured for TS/Node.js projects
- **Quality Insights**: Coverage, quality gates, code smells, vulnerabilities

### MCP Tools Available

1. **System Tools**
   - `health_check` - Verify SonarQube server status
   - `get_system_status` - Get server version and info

2. **Project Management**
   - `list_projects` - List all projects
   - `get_project` - Get specific project details
   - `generate_project_report` - Comprehensive project analysis

3. **Quality Analysis**
   - `get_project_issues` - Get filtered issues list
   - `get_quality_gate_status` - Quality gate status
   - `get_code_quality_metrics` - Bugs, vulnerabilities, code smells
   - `get_code_coverage` - Test coverage metrics
   - `get_analysis_history` - Analysis history and trends

### Using MCP Server with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": ["exec", "sonarqube-mcp-server", "node", "dist/index.js"],
      "env": {
        "SONARQUBE_URL": "http://localhost:9000"
      }
    }
  }
}
```

### MCP Server Commands

```powershell
# View MCP Server logs
docker-compose logs -f mcp-server

# Restart MCP Server only
docker-compose restart mcp-server

# Rebuild MCP Server
docker-compose build mcp-server
docker-compose up -d mcp-server
```

## Configuration Details

### Project Structure Expected

```
your-typescript-project/
├── src/                    # Source code
├── tests/ or test/         # Test files
├── tsconfig.json          # TypeScript configuration
├── package.json           # Node.js project file
└── sonar-project.properties  # SonarQube configuration
```

### TypeScript Configuration

The setup is optimized for:

- **Node.js**: Version ≥18.0.0
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **TypeScript**: Latest versions supported
- **Test Frameworks**: Jest, Mocha, Vitest, etc.

### Supported File Types

- `.ts`, `.tsx` - TypeScript files
- `.js`, `.jsx` - JavaScript files
- `.json` - Configuration files

### Coverage Reports

If you're using test coverage, configure your test runner to generate reports in these formats:

- **LCOV**: `coverage/lcov.info`
- **SonarQube XML**: `test-results/sonar-report.xml`

#### Example Jest Configuration

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage --coverageReporters=lcov"
  },
  "jest": {
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts"
    ]
  }
}
```

## Docker Commands

### Start Services
```powershell
docker-compose up -d
```

### Stop Services
```powershell
docker-compose down
```

### View Logs
```powershell
docker-compose logs -f sonarqube
docker-compose logs -f sonarqube-db
```

### Restart SonarQube
```powershell
docker-compose restart sonarqube
```

### Update/Rebuild
```powershell
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Memory Issues

If SonarQube fails to start, increase Docker memory:

1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase memory to at least 4GB
4. Restart Docker

### Database Connection Issues

```powershell
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart sonarqube-db
```

### Plugin Issues

If custom plugins fail to load:

```powershell
# Rebuild with fresh plugins
docker-compose down
docker-compose build --no-cache sonarqube
docker-compose up -d
```

### Port Conflicts

If port 9000 is in use:

1. Edit `docker-compose.yml`
2. Change `"9000:9000"` to `"9001:9000"` (or any available port)
3. Access SonarQube at http://localhost:9001

## Quality Gates and Rules

The setup includes default quality gates suitable for TypeScript/Node.js projects. You can customize them in the SonarQube web interface:

1. Go to **Quality Gates**
2. Create or modify existing gates
3. Set conditions for:
   - Code coverage
   - Duplicate lines
   - Maintainability rating
   - Reliability rating
   - Security rating

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: SonarQube Analysis
  run: |
    npm test -- --coverage
    npx sonar-scanner \
      -Dsonar.host.url=http://your-sonarqube-server:9000 \
      -Dsonar.login=${{ secrets.SONAR_TOKEN }}
```

### Jenkins Pipeline Example

```groovy
stage('SonarQube Analysis') {
    steps {
        script {
            def scannerHome = tool 'SonarQube Scanner'
            withSonarQubeEnv('SonarQube') {
                sh "${scannerHome}/bin/sonar-scanner"
            }
        }
    }
}
```

## Data Persistence

All data is persisted in Docker volumes:

- `sonarqube_data`: SonarQube application data
- `sonarqube_extensions`: Plugins and extensions
- `sonarqube_logs`: Application logs
- `postgresql_data`: Database data

To backup data:

```powershell
docker-compose exec sonarqube-db pg_dump -U sonar sonar > backup.sql
```

## Security Considerations

1. **Change default credentials** immediately
2. **Use HTTPS** in production
3. **Limit network access** to SonarQube server
4. **Regular updates** of Docker images
5. **Backup database** regularly

## Support

For issues with:

- **SonarQube**: [SonarQube Community](https://community.sonarsource.com/)
- **TypeScript Analysis**: [SonarJS Repository](https://github.com/SonarSource/SonarJS)
- **Docker**: [Docker Documentation](https://docs.docker.com/)

## License

This configuration is provided under MIT License. SonarQube Community Edition has its own licensing terms.
import { SonarQubeClient } from '../sonarqube-client.js';

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: (client: SonarQubeClient) => Promise<string>;
}

// SonarQube server information
export const serverInfoResource: MCPResource = {
  uri: 'sonarqube://server/info',
  name: 'SonarQube Server Information',
  description: 'Current SonarQube server status, version, and configuration',
  mimeType: 'application/json',
  handler: async (client) => {
    const status = await client.getSystemStatus();
    return JSON.stringify(status, null, 2);
  },
};

// All projects overview
export const projectsOverviewResource: MCPResource = {
  uri: 'sonarqube://projects/overview',
  name: 'Projects Overview',
  description: 'Overview of all projects in SonarQube with basic metrics',
  mimeType: 'application/json',
  handler: async (client) => {
    const projects = await client.getProjects();
    
    // Get basic metrics for each project
    const projectsWithMetrics = await Promise.all(
      projects.map(async (project) => {
        try {
          const qualityMetrics = await client.getCodeQualityMetrics(project.key);
          const coverage = await client.getCodeCoverage(project.key);
          const qualityGateStatus = await client.getQualityGateStatus(project.key);
          
          return {
            ...project,
            metrics: {
              quality: qualityMetrics,
              coverage: coverage,
              qualityGateStatus: qualityGateStatus?.status || 'UNKNOWN',
            },
          };
        } catch (error) {
          return {
            ...project,
            metrics: {
              error: 'Failed to fetch metrics',
            },
          };
        }
      })
    );
    
    return JSON.stringify({
      totalProjects: projects.length,
      projects: projectsWithMetrics,
      generatedAt: new Date().toISOString(),
    }, null, 2);
  },
};

// Quality gates information
export const qualityGatesResource: MCPResource = {
  uri: 'sonarqube://quality-gates/list',
  name: 'Quality Gates',
  description: 'List of all configured quality gates',
  mimeType: 'application/json',
  handler: async (client) => {
    const qualityGates = await client.getQualityGates();
    return JSON.stringify(qualityGates, null, 2);
  },
};

// TypeScript/JavaScript specific configuration
export const typescriptConfigResource: MCPResource = {
  uri: 'sonarqube://config/typescript',
  name: 'TypeScript Configuration',
  description: 'SonarQube configuration for TypeScript/JavaScript projects',
  mimeType: 'text/plain',
  handler: async (client) => {
    return `# SonarQube Configuration for TypeScript/Node.js Projects

## Project Configuration (sonar-project.properties)

# Project identification
sonar.projectKey=your-typescript-project
sonar.projectName=Your TypeScript Project
sonar.projectVersion=1.0

# Source code configuration
sonar.sources=src
sonar.tests=tests,test,spec,__tests__

# Language and file patterns
sonar.language=ts
sonar.inclusions=**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.json
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/*.d.ts,**/vendor/**,**/.next/**

# TypeScript specific configuration
sonar.typescript.node=18
sonar.typescript.tsconfigPath=tsconfig.json

# Test configuration
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/*.test.js,**/*.spec.js
sonar.test.exclusions=**/node_modules/**,**/dist/**,**/build/**

# Coverage reports
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=test-results/sonar-report.xml

# ES Modules configuration
sonar.javascript.environments=node,es2022

# Quality profiles
sonar.qualitygate.wait=true

## Running Analysis

1. Install SonarQube Scanner:
   npm install -g sonarqube-scanner
   # or
   npm install --save-dev sonarqube-scanner

2. Run tests with coverage:
   npm test -- --coverage

3. Run SonarQube analysis:
   sonar-scanner

## Docker Integration

If using this MCP Server with Docker:
- SonarQube URL: http://localhost:9000
- Default credentials: admin/admin
- Make sure to change default password after first login

## Jest Configuration Example

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
`;
  },
};

// Docker setup instructions
export const dockerSetupResource: MCPResource = {
  uri: 'sonarqube://setup/docker',
  name: 'Docker Setup Instructions',
  description: 'Instructions for setting up SonarQube with Docker',
  mimeType: 'text/markdown',
  handler: async (client) => {
    return `# SonarQube Docker Setup

## Current Configuration

This MCP Server is configured to work with a SonarQube instance running at:
- **URL**: http://localhost:9000
- **Default credentials**: admin/admin

## Docker Compose Configuration

The current setup includes:
- SonarQube Community Edition 10
- H2 embedded database (suitable for development)
- Optimized for TypeScript/Node.js projects
- ES Modules support

## Commands

### Start SonarQube
\`\`\`bash
docker-compose up -d
\`\`\`

### Stop SonarQube
\`\`\`bash
docker-compose down
\`\`\`

### View Logs
\`\`\`bash
docker-compose logs -f sonarqube
\`\`\`

### Check Status
\`\`\`bash
docker-compose ps
\`\`\`

## Health Check

To verify the setup is working:
1. Check server status: http://localhost:9000/api/system/status
2. Access web interface: http://localhost:9000
3. Use this MCP Server's health_check tool

## Troubleshooting

- **Container fails to start**: Check Docker memory allocation (minimum 4GB recommended)
- **Port conflicts**: Ensure port 9000 is available
- **Permission issues**: Restart Docker Desktop with administrator privileges

## Production Considerations

For production use, consider:
- Using PostgreSQL instead of H2 database
- Setting up HTTPS
- Configuring proper authentication
- Regular backups
- Resource limits and monitoring
`;
  },
};

export const sonarQubeResources = [
  serverInfoResource,
  projectsOverviewResource,
  qualityGatesResource,
  typescriptConfigResource,
  dockerSetupResource,
];
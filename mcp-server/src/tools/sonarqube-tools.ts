import { z } from 'zod';
import { SonarQubeClient } from '../sonarqube-client.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (args: any, client: SonarQubeClient) => Promise<any>;
}

// Get SonarQube system status
export const getSystemStatusTool: MCPTool = {
  name: 'get_system_status',
  description: 'Get SonarQube server status and version information',
  inputSchema: z.object({}),
  handler: async (args, client) => {
    const status = await client.getSystemStatus();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  },
};

// List all projects
export const listProjectsTool: MCPTool = {
  name: 'list_projects',
  description: 'List all projects in SonarQube',
  inputSchema: z.object({}),
  handler: async (args, client) => {
    const projects = await client.getProjects();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  },
};

// Get project details
export const getProjectTool: MCPTool = {
  name: 'get_project',
  description: 'Get detailed information about a specific project',
  inputSchema: z.object({
    projectKey: z.string().describe('The project key (e.g., "my-project")'),
  }),
  handler: async (args, client) => {
    const project = await client.getProject(args.projectKey);
    if (!project) {
      return {
        content: [
          {
            type: 'text',
            text: `Project "${args.projectKey}" not found`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2),
        },
      ],
    };
  },
};

// Get project issues
export const getProjectIssuesTool: MCPTool = {
  name: 'get_project_issues',
  description: 'Get issues for a specific project with optional filtering',
  inputSchema: z.object({
    projectKey: z.string().describe('The project key'),
    severities: z.array(z.enum(['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER'])).optional().describe('Filter by severities'),
    types: z.array(z.enum(['CODE_SMELL', 'BUG', 'VULNERABILITY', 'SECURITY_HOTSPOT'])).optional().describe('Filter by issue types'),
    statuses: z.array(z.string()).optional().describe('Filter by statuses'),
    resolved: z.boolean().optional().describe('Filter by resolution status'),
    pageSize: z.number().min(1).max(500).default(100).describe('Number of issues to return'),
  }),
  handler: async (args, client) => {
    const issues = await client.getIssues(args.projectKey, {
      severities: args.severities,
      types: args.types,
      statuses: args.statuses,
      resolved: args.resolved,
      pageSize: args.pageSize,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectKey: args.projectKey,
            totalIssues: issues.length,
            issues: issues,
          }, null, 2),
        },
      ],
    };
  },
};

// Get quality gate status
export const getQualityGateStatusTool: MCPTool = {
  name: 'get_quality_gate_status',
  description: 'Get quality gate status for a project',
  inputSchema: z.object({
    projectKey: z.string().describe('The project key'),
  }),
  handler: async (args, client) => {
    const status = await client.getQualityGateStatus(args.projectKey);
    if (!status) {
      return {
        content: [
          {
            type: 'text',
            text: `No quality gate status found for project "${args.projectKey}"`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  },
};

// Get code coverage
export const getCodeCoverageTool: MCPTool = {
  name: 'get_code_coverage',
  description: 'Get code coverage metrics for a project',
  inputSchema: z.object({
    projectKey: z.string().describe('The project key'),
  }),
  handler: async (args, client) => {
    const coverage = await client.getCodeCoverage(args.projectKey);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectKey: args.projectKey,
            coverage: coverage,
          }, null, 2),
        },
      ],
    };
  },
};

// Get code quality metrics
export const getCodeQualityMetricsTool: MCPTool = {
  name: 'get_code_quality_metrics',
  description: 'Get code quality metrics for a project (bugs, vulnerabilities, code smells, etc.)',
  inputSchema: z.object({
    projectKey: z.string().describe('The project key'),
  }),
  handler: async (args, client) => {
    const metrics = await client.getCodeQualityMetrics(args.projectKey);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectKey: args.projectKey,
            qualityMetrics: metrics,
          }, null, 2),
        },
      ],
    };
  },
};

// Get analysis history
export const getAnalysisHistoryTool: MCPTool = {
  name: 'get_analysis_history',
  description: 'Get analysis history for a project',
  inputSchema: z.object({
    projectKey: z.string().describe('The project key'),
    pageSize: z.number().min(1).max(100).default(10).describe('Number of analyses to return'),
  }),
  handler: async (args, client) => {
    const history = await client.getAnalysisHistory(args.projectKey, args.pageSize);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            projectKey: args.projectKey,
            analysisHistory: history,
          }, null, 2),
        },
      ],
    };
  },
};

// Health check
export const healthCheckTool: MCPTool = {
  name: 'health_check',
  description: 'Check if SonarQube server is healthy and accessible',
  inputSchema: z.object({}),
  handler: async (args, client) => {
    const isHealthy = await client.checkHealth();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            healthy: isHealthy,
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  },
};

// Generate project report
export const generateProjectReportTool: MCPTool = {
  name: 'generate_project_report',
  description: 'Generate a comprehensive report for a project including quality metrics, issues summary, and coverage',
  inputSchema: z.object({
    projectKey: z.string().describe('The project key'),
    includeIssues: z.boolean().default(true).describe('Include issues in the report'),
    includeHistory: z.boolean().default(false).describe('Include analysis history'),
  }),
  handler: async (args, client) => {
    try {
      // Get project details
      const project = await client.getProject(args.projectKey);
      if (!project) {
        return {
          content: [
            {
              type: 'text',
              text: `Project "${args.projectKey}" not found`,
            },
          ],
        };
      }

      // Get quality gate status
      const qualityGateStatus = await client.getQualityGateStatus(args.projectKey);
      
      // Get metrics
      const qualityMetrics = await client.getCodeQualityMetrics(args.projectKey);
      const coverage = await client.getCodeCoverage(args.projectKey);

      // Get issues summary
      let issuesSummary = null;
      if (args.includeIssues) {
        const issues = await client.getIssues(args.projectKey, { pageSize: 500 });
        
        // Group issues by severity and type
        const issuesBySeverity = issues.reduce((acc: any, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        }, {});

        const issuesByType = issues.reduce((acc: any, issue) => {
          acc[issue.type] = (acc[issue.type] || 0) + 1;
          return acc;
        }, {});

        issuesSummary = {
          total: issues.length,
          bySeverity: issuesBySeverity,
          byType: issuesByType,
          top10Issues: issues.slice(0, 10),
        };
      }

      // Get analysis history
      let analysisHistory = null;
      if (args.includeHistory) {
        analysisHistory = await client.getAnalysisHistory(args.projectKey, 5);
      }

      const report = {
        project: project,
        qualityGate: qualityGateStatus,
        metrics: {
          quality: qualityMetrics,
          coverage: coverage,
        },
        issues: issuesSummary,
        history: analysisHistory,
        generatedAt: new Date().toISOString(),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating report: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
};
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// Configuration schema for SonarQube client
const SonarQubeConfigSchema = z.object({
  sonarqubeUrl: z.string(),
  username: z.string(),
  password: z.string(),
  token: z.string().optional(),
});

export type SonarQubeConfig = z.infer<typeof SonarQubeConfigSchema>;

// API Response schemas
export const ProjectSchema = z.object({
  key: z.string(),
  name: z.string(),
  qualifier: z.string(),
  lastAnalysisDate: z.string().optional(),
  revision: z.string().optional(),
});

export const IssueSchema = z.object({
  key: z.string(),
  rule: z.string(),
  severity: z.string(),
  component: z.string(),
  project: z.string(),
  line: z.number().optional(),
  message: z.string(),
  effort: z.string().optional(),
  debt: z.string().optional(),
  status: z.string(),
  type: z.string(),
});

export const MetricSchema = z.object({
  metric: z.string(),
  value: z.string(),
  component: z.string(),
});

export const QualityGateSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
  isBuiltIn: z.boolean(),
});

export const QualityGateStatusSchema = z.object({
  status: z.string(),
  conditions: z.array(z.object({
    status: z.string(),
    metricKey: z.string(),
    comparator: z.string(),
    errorThreshold: z.string().optional(),
    actualValue: z.string().optional(),
  })),
});

export type Project = z.infer<typeof ProjectSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type QualityGate = z.infer<typeof QualityGateSchema>;
export type QualityGateStatus = z.infer<typeof QualityGateStatusSchema>;

export class SonarQubeClient {
  private client: AxiosInstance;
  private config: SonarQubeConfig;

  constructor(config: SonarQubeConfig) {
    this.config = SonarQubeConfigSchema.parse(config);
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: this.config.sonarqubeUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set authentication
    if (this.config.token) {
      this.client.defaults.auth = {
        username: this.config.token,
        password: '',
      };
    } else {
      this.client.defaults.auth = {
        username: this.config.username,
        password: this.config.password,
      };
    }
  }

  // Health check method - verifies SonarQube server connectivity
  async healthCheck(): Promise<{ status: string; accessible: boolean; error?: string }> {
    try {
      const response = await this.client.get('/api/system/status');
      return {
        status: response.data.status || 'UNKNOWN',
        accessible: true
      };
    } catch (error) {
      return {
        status: 'DOWN',
        accessible: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Get server status
  async getSystemStatus(): Promise<{ status: string; version: string; id: string }> {
    const response = await this.client.get('/api/system/status');
    return response.data;
  }

  // Get all projects
  async getProjects(): Promise<Project[]> {
    const response = await this.client.get('/api/projects/search');
    return response.data.components || [];
  }

  // Get project details
  async getProject(projectKey: string): Promise<Project | null> {
    try {
      const response = await this.client.get(`/api/projects/search?projects=${projectKey}`);
      const projects = response.data.components || [];
      return projects.length > 0 ? projects[0] : null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Get issues for a project
  async getIssues(projectKey: string, options: {
    severities?: string[];
    types?: string[];
    statuses?: string[];
    resolved?: boolean;
    pageSize?: number;
  } = {}): Promise<Issue[]> {
    const params = new URLSearchParams({
      componentKeys: projectKey,
      ps: (options.pageSize || 100).toString(),
    });

    if (options.severities?.length) {
      params.append('severities', options.severities.join(','));
    }
    if (options.types?.length) {
      params.append('types', options.types.join(','));
    }
    if (options.statuses?.length) {
      params.append('statuses', options.statuses.join(','));
    }
    if (options.resolved !== undefined) {
      params.append('resolved', options.resolved.toString());
    }

    const response = await this.client.get(`/api/issues/search?${params}`);
    return response.data.issues || [];
  }

  // Get project metrics
  async getProjectMetrics(projectKey: string, metrics: string[]): Promise<Metric[]> {
    const response = await this.client.get('/api/measures/component', {
      params: {
        component: projectKey,
        metricKeys: metrics.join(','),
      },
    });

    return response.data.component?.measures || [];
  }

  // Get quality gates
  async getQualityGates(): Promise<QualityGate[]> {
    const response = await this.client.get('/api/qualitygates/list');
    return response.data.qualitygates || [];
  }

  // Get quality gate status for a project
  async getQualityGateStatus(projectKey: string): Promise<QualityGateStatus | null> {
    try {
      const response = await this.client.get('/api/qualitygates/project_status', {
        params: { projectKey },
      });
      return response.data.projectStatus || null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Get code coverage metrics
  async getCodeCoverage(projectKey: string): Promise<{
    lineCoverage?: string;
    branchCoverage?: string;
    uncoveredLines?: string;
    uncoveredConditions?: string;
  }> {
    const metrics = ['line_coverage', 'branch_coverage', 'uncovered_lines', 'uncovered_conditions'];
    const measures = await this.getProjectMetrics(projectKey, metrics);
    
    const result: any = {};
    measures.forEach(measure => {
      switch (measure.metric) {
        case 'line_coverage':
          result.lineCoverage = measure.value;
          break;
        case 'branch_coverage':
          result.branchCoverage = measure.value;
          break;
        case 'uncovered_lines':
          result.uncoveredLines = measure.value;
          break;
        case 'uncovered_conditions':
          result.uncoveredConditions = measure.value;
          break;
      }
    });
    
    return result;
  }

  // Get code quality metrics
  async getCodeQualityMetrics(projectKey: string): Promise<{
    codeSmells?: string;
    bugs?: string;
    vulnerabilities?: string;
    securityHotspots?: string;
    duplicatedLines?: string;
    duplicatedLinesDensity?: string;
    maintainabilityRating?: string;
    reliabilityRating?: string;
    securityRating?: string;
  }> {
    const metrics = [
      'code_smells',
      'bugs',
      'vulnerabilities',
      'security_hotspots',
      'duplicated_lines',
      'duplicated_lines_density',
      'sqale_rating',
      'reliability_rating',
      'security_rating'
    ];
    
    const measures = await this.getProjectMetrics(projectKey, metrics);
    
    const result: any = {};
    measures.forEach(measure => {
      switch (measure.metric) {
        case 'code_smells':
          result.codeSmells = measure.value;
          break;
        case 'bugs':
          result.bugs = measure.value;
          break;
        case 'vulnerabilities':
          result.vulnerabilities = measure.value;
          break;
        case 'security_hotspots':
          result.securityHotspots = measure.value;
          break;
        case 'duplicated_lines':
          result.duplicatedLines = measure.value;
          break;
        case 'duplicated_lines_density':
          result.duplicatedLinesDensity = measure.value;
          break;
        case 'sqale_rating':
          result.maintainabilityRating = measure.value;
          break;
        case 'reliability_rating':
          result.reliabilityRating = measure.value;
          break;
        case 'security_rating':
          result.securityRating = measure.value;
          break;
      }
    });
    
    return result;
  }

  // Get analysis history
  async getAnalysisHistory(projectKey: string, pageSize: number = 10): Promise<any[]> {
    const response = await this.client.get('/api/project_analyses/search', {
      params: {
        project: projectKey,
        ps: pageSize,
      },
    });
    return response.data.analyses || [];
  }

  // Check server health
  async checkHealth(): Promise<boolean> {
    try {
      const status = await this.getSystemStatus();
      return status.status === 'UP';
    } catch {
      return false;
    }
  }
}
import {
  getSystemStatusTool,
  listProjectsTool,
  getProjectTool,
  getProjectIssuesTool,
  getQualityGateStatusTool,
  getCodeCoverageTool,
  getCodeQualityMetricsTool,
  getAnalysisHistoryTool,
  healthCheckTool,
  generateProjectReportTool,
} from './sonarqube-tools.js';

export const sonarQubeTools = [
  getSystemStatusTool,
  listProjectsTool,
  getProjectTool,
  getProjectIssuesTool,
  getQualityGateStatusTool,
  getCodeCoverageTool,
  getCodeQualityMetricsTool,
  getAnalysisHistoryTool,
  healthCheckTool,
  generateProjectReportTool,
];
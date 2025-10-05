#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createServer } from 'http';
import { SonarQubeClient } from './sonarqube-client.js';
import { sonarQubeTools } from './tools/index.js';
import { sonarQubeResources } from './resources/index.js';

// Configuration schema
const ConfigSchema = z.object({
  sonarqubeUrl: z.string(),
  username: z.string(),
  password: z.string(),
  token: z.string().optional(),
  port: z.number(),
  mode: z.enum(['stdio', 'http', 'both']),
});

type Config = z.infer<typeof ConfigSchema>;

class SonarQubeMCPServer {
  private server: Server;
  private sonarQubeClient: SonarQubeClient;
  private config: Config;

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = ['SONARQUBE_PASSWORD'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    this.config = ConfigSchema.parse({
      sonarqubeUrl: process.env.SONARQUBE_URL || 'http://localhost:9000',
      username: process.env.SONARQUBE_USERNAME || 'admin',
      password: process.env.SONARQUBE_PASSWORD,
      token: process.env.SONARQUBE_TOKEN,
      port: parseInt(process.env.PORT || '8080'),
      mode: (process.env.MCP_MODE as 'stdio' | 'http' | 'both') || 'both',
    });

    this.sonarQubeClient = new SonarQubeClient(this.config);
    this.server = new Server(
      {
        name: 'sonarqube-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: sonarQubeTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = sonarQubeTools.find(t => t.name === name);
      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
      }

      try {
        const result = await tool.handler(args, this.sonarQubeClient);
        return result;
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: sonarQubeResources.map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        })),
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      const resource = sonarQubeResources.find(r => r.uri === uri);
      if (!resource) {
        throw new McpError(ErrorCode.InvalidRequest, `Resource ${uri} not found`);
      }

      try {
        const content = await resource.handler(this.sonarQubeClient);
        return {
          contents: [
            {
              uri,
              mimeType: resource.mimeType,
              text: content,
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Resource read failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async run() {
    if (this.config.mode === 'stdio' || this.config.mode === 'both') {
      // Start stdio transport for MCP clients
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('SonarQube MCP Server running on stdio');
    }

    if (this.config.mode === 'http' || this.config.mode === 'both') {
      // Start HTTP server for debugging and health checks
      this.startHttpServer();
    }

    // Keep the process alive
    if (this.config.mode === 'http') {
      return new Promise(() => {}); // Keep alive
    }
  }

  private startHttpServer() {
    const httpServer = createServer(async (req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      
      try {
        if (url.pathname === '/health') {
          // Health check endpoint
          const healthStatus = await this.sonarQubeClient.healthCheck();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            status: 'healthy', 
            mcp_server: 'running',
            sonarqube: healthStatus,
            config: {
              sonarqubeUrl: this.config.sonarqubeUrl,
              mode: this.config.mode
            }
          }));
        } else if (url.pathname === '/tools') {
          // List available tools
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            tools: sonarQubeTools.map(tool => ({
              name: tool.name,
              description: tool.description
            }))
          }));
        } else if (url.pathname === '/resources') {
          // List available resources
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            resources: sonarQubeResources.map(resource => ({
              uri: resource.uri,
              name: resource.name,
              description: resource.description
            }))
          }));
        } else if (url.pathname === '/') {
          // Main info endpoint
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            name: 'SonarQube MCP Server',
            version: '1.0.0',
            mode: this.config.mode,
            sonarqubeUrl: this.config.sonarqubeUrl,
            endpoints: {
              health: '/health',
              tools: '/tools',
              resources: '/resources',
              projects: '/projects'
            }
          }));
        } else if (url.pathname === '/projects') {
          // List projects endpoint
          try {
            const projects = await this.sonarQubeClient.getProjects();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              total: projects.length,
              projects: projects
            }));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Failed to fetch projects', 
              message: error instanceof Error ? error.message : String(error)
            }));
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Internal server error', 
          message: error instanceof Error ? error.message : String(error)
        }));
      }
    });

    httpServer.listen(this.config.port, () => {
      console.error(`SonarQube MCP Server HTTP interface running on port ${this.config.port}`);
      console.error(`Health check: http://localhost:${this.config.port}/health`);
      console.error(`Tools list: http://localhost:${this.config.port}/tools`);
      console.error(`Resources list: http://localhost:${this.config.port}/resources`);
    });
  }
}

const server = new SonarQubeMCPServer();
server.run().catch(console.error);
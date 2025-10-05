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
import { SonarQubeClient } from './sonarqube-client.js';
import { sonarQubeTools } from './tools/index.js';
import { sonarQubeResources } from './resources/index.js';

// Configuration schema
const ConfigSchema = z.object({
  sonarqubeUrl: z.string().default('http://localhost:9000'),
  username: z.string().default('admin'),
  password: z.string().default('admin'),
  token: z.string().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

class SonarQubeMCPServer {
  private server: Server;
  private sonarQubeClient: SonarQubeClient;
  private config: Config;

  constructor() {
    this.config = ConfigSchema.parse({
      sonarqubeUrl: process.env.SONARQUBE_URL || 'http://localhost:9000',
      username: process.env.SONARQUBE_USERNAME || 'admin',
      password: process.env.SONARQUBE_PASSWORD || 'admin',
      token: process.env.SONARQUBE_TOKEN,
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
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SonarQube MCP Server running on stdio');
  }
}

const server = new SonarQubeMCPServer();
server.run().catch(console.error);
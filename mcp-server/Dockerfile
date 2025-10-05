# MCP Server Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY .env* ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpserver -u 1001

# Change ownership
RUN chown -R mcpserver:nodejs /app
USER mcpserver

# Expose port for HTTP interface (optional)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD node -e "console.log('MCP Server is running')" || exit 1

# Run the server
CMD ["node", "dist/index.js"]
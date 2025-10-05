FROM sonarqube:10-community

# Switch to root to install additional plugins
USER root

# Create plugins directory if it doesn't exist
RUN mkdir -p /opt/sonarqube/extensions/plugins

# Download and install TypeScript/JavaScript plugins
# SonarJS plugin (includes TypeScript support) - usually comes pre-installed but ensuring latest version
RUN curl -L -o /opt/sonarqube/extensions/plugins/sonar-javascript-plugin.jar \
    https://github.com/SonarSource/SonarJS/releases/download/10.10.0.27621/sonar-javascript-plugin-10.10.0.27621.jar

# Optional: Install additional community plugins for better TypeScript support
# ESLint Plugin for SonarQube
RUN curl -L -o /opt/sonarqube/extensions/plugins/sonar-eslint-plugin.jar \
    https://github.com/SonarSource/eslint-plugin-sonarjs/releases/download/0.25.0/sonar-eslint-plugin-0.25.0.jar || true

# Set correct permissions
RUN chown -R sonarqube:sonarqube /opt/sonarqube/extensions/plugins
RUN chmod 644 /opt/sonarqube/extensions/plugins/*.jar

# Switch back to sonarqube user
USER sonarqube

# Expose the default SonarQube port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:9000/api/system/status || exit 1
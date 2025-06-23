import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { DEPENDENCY_SERVERS } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store child processes for cleanup
const childProcesses = [];

/**
 * Check if a server is running by making an HTTP request
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - True if server is responding
 */
async function isServerRunning(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      timeout: 2000, // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Start a server process
 * @param {Object} serverConfig - Server configuration object
 * @param {string} serverConfig.name - Display name for the server
 * @param {string} serverConfig.command - Command to run
 * @param {string[]} serverConfig.args - Arguments for the command
 * @param {string} serverConfig.cwd - Working directory
 * @param {string} [serverConfig.healthCheck] - URL to check for health
 * @param {number} [serverConfig.startupDelay] - Time to wait before health check
 * @returns {Promise<void>} - Resolves when server is started
 */
function startServer(serverConfig) {
  return new Promise((resolve, reject) => {
    console.error(`🚀 Starting ${serverConfig.name}...`);

    const process = spawn(serverConfig.command, serverConfig.args, {
      cwd: serverConfig.cwd,
      stdio: "pipe",
      shell: true,
    });

    // Store process for cleanup
    childProcesses.push({
      name: serverConfig.name,
      process: process,
    });

    // Log server output (only errors to stderr to avoid cluttering MCP output)
    process.stdout.on("data", (data) => {
      // Suppress normal output to keep MCP clean
    });

    process.stderr.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          console.error(`[${serverConfig.name}] ${line}`);
        }
      });
    });

    process.on("error", (error) => {
      console.error(
        `❌ Failed to start ${serverConfig.name}: ${error.message}`
      );
      reject(error);
    });

    // Wait for server to start up
    setTimeout(async () => {
      if (serverConfig.healthCheck) {
        // Check if server is responding
        const isRunning = await isServerRunning(serverConfig.healthCheck);
        if (isRunning) {
          console.error(`✅ ${serverConfig.name} started successfully`);
          resolve();
        } else {
          console.error(
            `⚠️ ${serverConfig.name} may not have started properly`
          );
          resolve(); // Continue anyway
        }
      } else {
        console.error(`✅ ${serverConfig.name} started`);
        resolve();
      }
    }, serverConfig.startupDelay || 3000);
  });
}

/**
 * Ensure all required dependencies are running, starting them if necessary
 * @param {string} dbServerUrl - Database server URL
 * @param {string} webServerUrl - Web server URL
 * @returns {Promise<void>} - Resolves when all dependencies are running
 */
async function ensureDependenciesRunning(dbServerUrl, webServerUrl) {
  console.error("🔍 Checking if dependencies are running...");

  // Build dependency configurations with actual URLs
  const dependencies = DEPENDENCY_SERVERS.map((config) => ({
    ...config,
    url: config.name === "Database Server" ? dbServerUrl : webServerUrl,
    cwd: path.join(__dirname, "..", config.relativePath),
    healthCheck:
      config.name === "Database Server"
        ? `${dbServerUrl}${config.healthCheckPath}`
        : webServerUrl,
  }));

  for (const dep of dependencies) {
    const isRunning = await isServerRunning(dep.url);

    if (isRunning) {
      console.error(`✅ ${dep.name} is already running`);
    } else {
      console.error(`⚠️ ${dep.name} is not running, starting it...`);
      try {
        await startServer(dep);
      } catch (error) {
        console.error(`❌ Failed to start ${dep.name}: ${error.message}`);
        throw error;
      }
    }
  }
}

/**
 * Cleanup function for graceful shutdown of child processes
 */
function cleanup() {
  console.error("🧹 Cleaning up child processes...");
  childProcesses.forEach(({ name, process }) => {
    if (process && !process.killed) {
      console.error(`🛑 Stopping ${name}...`);
      process.kill("SIGTERM");
    }
  });
}

/**
 * Setup cleanup handlers for graceful shutdown
 */
function setupCleanupHandlers() {
  // Register cleanup handlers
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  process.on("exit", cleanup);
}

export {
  isServerRunning,
  startServer,
  ensureDependenciesRunning,
  cleanup,
  setupCleanupHandlers,
};

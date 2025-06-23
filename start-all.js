#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better logging
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Server configurations
const servers = [
  {
    name: "DB Server",
    command: "node",
    args: ["db_server.js"],
    cwd: path.join(__dirname, "db_server"),
    color: colors.green,
    port: 1029,
  },
  {
    name: "Web Server",
    command: "npm",
    args: ["run", "dev"],
    cwd: path.join(__dirname, "web_server"),
    color: colors.blue,
    port: 5173,
  },
  {
    name: "MCP Server",
    command: "node",
    args: ["mcp_server.js"],
    cwd: path.join(__dirname, "mcp_server"),
    color: colors.magenta,
    port: null,
  },
];

const processes = [];

function logWithColor(serverName, color, message) {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(
    `${color}[${timestamp}] [${serverName}]${colors.reset} ${message}`
  );
}

function startServer(serverConfig) {
  return new Promise((resolve, reject) => {
    logWithColor(serverConfig.name, serverConfig.color, `Starting...`);

    const process = spawn(serverConfig.command, serverConfig.args, {
      cwd: serverConfig.cwd,
      stdio: "pipe",
      shell: true,
    });

    // Log stdout
    process.stdout.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          logWithColor(serverConfig.name, serverConfig.color, line);
        }
      });
    });

    // Log stderr
    process.stderr.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line) => {
        if (line.trim()) {
          logWithColor(serverConfig.name, colors.red, `ERROR: ${line}`);
        }
      });
    });

    // Handle process exit
    process.on("close", (code) => {
      if (code !== 0) {
        logWithColor(serverConfig.name, colors.red, `Exited with code ${code}`);
      } else {
        logWithColor(serverConfig.name, serverConfig.color, `Stopped`);
      }
    });

    // Handle startup errors
    process.on("error", (error) => {
      logWithColor(
        serverConfig.name,
        colors.red,
        `Failed to start: ${error.message}`
      );
      reject(error);
    });

    // Store process reference
    processes.push({
      name: serverConfig.name,
      process: process,
      config: serverConfig,
    });

    // Consider the server started after a short delay
    setTimeout(() => {
      logWithColor(
        serverConfig.name,
        serverConfig.color,
        `Started successfully`
      );
      resolve();
    }, 2000);
  });
}

async function startAllServers() {
  console.log(
    `${colors.bright}${colors.cyan}🚀 Starting Checklist MCP Project${colors.reset}\n`
  );

  try {
    // Start all servers concurrently
    await Promise.all(servers.map(startServer));

    console.log(
      `\n${colors.bright}${colors.green}✅ All servers started successfully!${colors.reset}`
    );
    console.log(
      `${colors.bright}${colors.cyan}📱 Web interface: http://localhost:5173${colors.reset}`
    );
    console.log(
      `${colors.bright}${colors.cyan}🗄️  Database API: http://localhost:1029${colors.reset}`
    );
    console.log(
      `${colors.bright}${colors.yellow}Press Ctrl+C to stop all servers${colors.reset}\n`
    );
  } catch (error) {
    console.error(
      `${colors.red}❌ Failed to start servers:${colors.reset}`,
      error.message
    );
    process.exit(1);
  }
}

// Graceful shutdown handler
function handleShutdown(signal) {
  console.log(
    `\n${colors.yellow}🛑 Received ${signal}, shutting down all servers...${colors.reset}`
  );

  processes.forEach(({ name, process }) => {
    if (process && !process.killed) {
      logWithColor(name, colors.yellow, "Stopping...");
      process.kill("SIGTERM");
    }
  });

  // Force exit after 5 seconds if processes don't stop gracefully
  setTimeout(() => {
    console.log(
      `${colors.red}⚠️  Force killing remaining processes${colors.reset}`
    );
    processes.forEach(({ process }) => {
      if (process && !process.killed) {
        process.kill("SIGKILL");
      }
    });
    process.exit(0);
  }, 5000);
}

// Register shutdown handlers
process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error(`${colors.red}❌ Uncaught Exception:${colors.reset}`, error);
  handleShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    `${colors.red}❌ Unhandled Rejection at:${colors.reset}`,
    promise,
    "reason:",
    reason
  );
  handleShutdown("unhandledRejection");
});

// Start the servers
startAllServers();

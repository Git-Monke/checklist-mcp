#!/usr/bin/env node

import { spawn } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for better output
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

// Directories to install dependencies in
const directories = [
  { name: "Root", path: "." },
  { name: "Database Server", path: "db_server" },
  { name: "Web Server", path: "web_server" },
  { name: "MCP Server", path: "mcp_server" },
];

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runNpmInstall(dir) {
  return new Promise((resolve, reject) => {
    const fullPath = join(__dirname, dir.path);

    log(
      `\n${colors.cyan}📦 Installing dependencies for ${dir.name}...${colors.reset}`
    );
    log(`${colors.blue}   Directory: ${fullPath}${colors.reset}`);

    const npmProcess = spawn("npm", ["install"], {
      cwd: fullPath,
      stdio: "pipe",
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    npmProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    npmProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    npmProcess.on("close", (code) => {
      if (code === 0) {
        log(
          `${colors.green}✅ ${dir.name} - Dependencies installed successfully!${colors.reset}`
        );
        resolve({ success: true, dir: dir.name });
      } else {
        log(
          `${colors.red}❌ ${dir.name} - Installation failed!${colors.reset}`
        );
        if (stderr) {
          log(`${colors.red}Error output:${colors.reset}`);
          log(stderr);
        }
        reject({ success: false, dir: dir.name, error: stderr || stdout });
      }
    });

    npmProcess.on("error", (error) => {
      log(
        `${colors.red}❌ ${dir.name} - Failed to start npm install: ${error.message}${colors.reset}`
      );
      reject({ success: false, dir: dir.name, error: error.message });
    });
  });
}

async function buildAll() {
  log(
    `${colors.bright}${colors.magenta}🚀 Building Checklist MCP Project${colors.reset}`
  );
  log(
    `${colors.bright}Installing dependencies in all directories...${colors.reset}\n`
  );

  const startTime = Date.now();

  try {
    // Run all npm installs concurrently
    const results = await Promise.allSettled(
      directories.map((dir) => runNpmInstall(dir))
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Summary
    log(
      `\n${colors.bright}${colors.cyan}📋 Installation Summary:${colors.reset}`
    );
    log(`${colors.cyan}${"=".repeat(50)}${colors.reset}`);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    ).length;
    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length;

    results.forEach((result, index) => {
      const dir = directories[index];
      if (result.status === "fulfilled") {
        log(
          `${colors.green}✅ ${dir.name.padEnd(20)} - Success${colors.reset}`
        );
      } else {
        log(`${colors.red}❌ ${dir.name.padEnd(20)} - Failed${colors.reset}`);
      }
    });

    log(`${colors.cyan}${"=".repeat(50)}${colors.reset}`);
    log(
      `${colors.bright}Total: ${successful + failed} | Success: ${
        colors.green
      }${successful}${colors.reset}${colors.bright} | Failed: ${
        colors.red
      }${failed}${colors.reset}${colors.bright}${colors.reset}`
    );
    log(
      `${colors.bright}Duration: ${colors.yellow}${duration}s${colors.reset}`
    );

    if (failed === 0) {
      log(
        `\n${colors.green}${colors.bright}🎉 All dependencies installed successfully!${colors.reset}`
      );

      process.exit(0);
    } else {
      log(
        `\n${colors.red}${colors.bright}❌ Some installations failed. Please check the errors above.${colors.reset}`
      );
      process.exit(1);
    }
  } catch (error) {
    log(
      `${colors.red}${colors.bright}💥 Unexpected error during build:${colors.reset}`
    );
    log(`${colors.red}${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  log(`\n${colors.yellow}🛑 Build interrupted by user${colors.reset}`);
  process.exit(1);
});

// Start the build process
buildAll();

#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { z } from "zod";
import {
  ensureDependenciesRunning,
  setupCleanupHandlers,
} from "./src/dependency-manager.js";
import {
  DB_SERVER_URL,
  WEB_SERVER_URL,
  MCP_SERVER_CONFIG,
  DB_REQUEST_DEFAULTS,
} from "./src/config.js";
import { registerTools, formatItems, flattenItems } from "./src/tools.js";

// Setup graceful shutdown handlers
setupCleanupHandlers();

// Create the MCP server
const server = new McpServer(MCP_SERVER_CONFIG);

// Helper function to make requests to the database server
async function dbRequest(path, options = {}) {
  const url = `${DB_SERVER_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      ...DB_REQUEST_DEFAULTS.headers,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(
      `Database request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// Register tools from the tools module
registerTools(server, dbRequest);

// Resources - Provide context/data that LLMs can reference

// Resource: All lists overview
server.registerResource(
  "all_lists",
  "checklist://lists/all",
  {
    title: "All Checklist Lists",
    description: "Overview of all available checklist lists",
    mimeType: "text/plain",
  },
  async () => {
    try {
      const lists = await dbRequest("/lists");
      const content =
        `Checklist Database Overview\n` +
        `==========================\n\n` +
        `Total Lists: ${lists.length}\n\n` +
        lists
          .map(
            (list) =>
              `• ${list.name} (ID: ${list.id})\n` +
              `  Created: ${list.created_at}\n` +
              `  Updated: ${list.updated_at}\n`
          )
          .join("\n");

      return {
        contents: [
          {
            uri: "checklist://lists/all",
            text: content,
            mimeType: "text/plain",
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: "checklist://lists/all",
            text: `Error loading lists: ${error.message}`,
            mimeType: "text/plain",
          },
        ],
      };
    }
  }
);

// Dynamic resource: Individual list details
server.registerResource(
  "list_detail",
  new ResourceTemplate("checklist://lists/{list_id}", { list: undefined }),
  {
    title: "List Details",
    description: "Detailed view of a specific checklist with all items",
  },
  async (uri, { list_id }) => {
    try {
      const list = await dbRequest(`/lists/${list_id}`);

      function formatItemsForResource(items, level = 0) {
        return items
          .map((item) => {
            const indent = "  ".repeat(level);
            const checkbox = item.checked ? "[x]" : "[ ]";
            let result = `${indent}${checkbox} ${item.text}`;
            if (item.children && item.children.length > 0) {
              result += "\n" + formatItemsForResource(item.children, level + 1);
            }
            return result;
          })
          .join("\n");
      }

      const itemsText =
        list.items && list.items.length > 0
          ? formatItemsForResource(list.items)
          : "No items yet";

      const content =
        `${list.name}\n` +
        `${"=".repeat(list.name.length)}\n\n` +
        `List ID: ${list.id}\n` +
        `Created: ${list.created_at}\n` +
        `Last Updated: ${list.updated_at}\n\n` +
        `Items:\n${itemsText}`;

      return {
        contents: [
          {
            uri: uri.href,
            text: content,
            mimeType: "text/plain",
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error loading list ${list_id}: ${error.message}`,
            mimeType: "text/plain",
          },
        ],
      };
    }
  }
);

// Prompts - Provide templated interactions

// Prompt: Create a new list with items
server.registerPrompt(
  "create_list_with_items",
  {
    title: "Create List with Items",
    description:
      "Template for creating a new list and populating it with items",
    argsSchema: {
      list_name: z.string().describe("The name of the new list"),
      items_description: z
        .string()
        .describe("Description of what items should be added to the list"),
    },
  },
  ({ list_name, items_description }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please create a new checklist called "${list_name}" and add items based on this description: ${items_description}\n\nFirst create the list, then add the individual items one by one. Make sure to organize them logically and mark any items that should start as completed.`,
        },
      },
    ],
  })
);

// Prompt: List management assistant
server.registerPrompt(
  "list_assistant",
  {
    title: "List Management Assistant",
    description: "Get help managing and organizing your checklists",
    argsSchema: {
      task: z
        .string()
        .describe(
          "What you want to do with your lists (e.g., 'organize my lists', 'check progress', 'add items')"
        ),
    },
  },
  ({ task }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need help with my checklists. Here's what I want to do: ${task}\n\nPlease first check my current lists to understand what I have, then help me accomplish this task. Use the available tools to view, create, update, or organize my checklist data as needed.`,
        },
      },
    ],
  })
);

// Start the MCP server
async function main() {
  console.error("🚀 Starting Checklist MCP Server...");
  console.error(`Database server URL: ${DB_SERVER_URL}`);
  console.error(`Web server URL: ${WEB_SERVER_URL}`);

  // Ensure all dependencies are running
  try {
    await ensureDependenciesRunning(DB_SERVER_URL, WEB_SERVER_URL);
    console.error("✅ All dependencies are running");
  } catch (error) {
    console.error(`❌ Failed to start dependencies: ${error.message}`);
    console.error("Cannot proceed without required services");
    process.exit(1);
  }

  // Test connection to database server
  try {
    await dbRequest("/lists");
    console.error("✅ Successfully connected to database server");
  } catch (error) {
    console.error(`❌ Failed to connect to database server: ${error.message}`);
    console.error("Database server may not be ready yet, but will proceed...");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🧠 Checklist MCP Server running on stdio");
}

// Handle errors and start server
main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});

#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { z } from "zod";

const DB_SERVER_URL = process.env.DB_SERVER_URL || "http://localhost:1029";

// Create the MCP server
const server = new McpServer({
  name: "checklist-mcp-server",
  version: "1.0.0",
  description:
    "MCP server for checklist management - allows LLMs to read and manage checklist data",
});

// Helper function to make requests to the database server
async function dbRequest(path, options = {}) {
  const url = `${DB_SERVER_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
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

// Tools - Allow LLMs to perform actions

// Tool: Get all lists
server.registerTool(
  "get_all_lists",
  {
    title: "Get All Lists",
    description: "Retrieve all checklist lists with their basic information",
    inputSchema: {},
  },
  async () => {
    try {
      const lists = await dbRequest("/lists");
      return {
        content: [
          {
            type: "text",
            text:
              `Found ${lists.length} lists:\n\n` +
              lists
                .map(
                  (list) =>
                    `• ${list.name} (ID: ${list.id}, Created: ${list.created_at})`
                )
                .join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving lists: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get specific list with items
server.registerTool(
  "get_list",
  {
    title: "Get List Details",
    description: "Retrieve a specific list with all its items and hierarchy",
    inputSchema: {
      list_id: z.number().describe("The ID of the list to retrieve"),
    },
  },
  async ({ list_id }) => {
    try {
      const list = await dbRequest(`/lists/${list_id}`);

      function formatItems(items, level = 0) {
        return items
          .map((item) => {
            const indent = "  ".repeat(level);
            const checkbox = item.checked ? "☑️" : "☐";
            let result = `${indent}${checkbox} ${item.text}`;
            if (item.children && item.children.length > 0) {
              result += "\n" + formatItems(item.children, level + 1);
            }
            return result;
          })
          .join("\n");
      }

      const itemsText =
        list.items && list.items.length > 0
          ? formatItems(list.items)
          : "No items yet";

      return {
        content: [
          {
            type: "text",
            text:
              `**${list.name}**\n` +
              `ID: ${list.id}\n` +
              `Created: ${list.created_at}\n` +
              `Last Updated: ${list.updated_at}\n\n` +
              `**Items:**\n${itemsText}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving list: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Create new list
server.registerTool(
  "create_list",
  {
    title: "Create New List",
    description: "Create a new checklist with the specified name",
    inputSchema: {
      name: z.string().describe("The name of the new list"),
    },
  },
  async ({ name }) => {
    try {
      const newList = await dbRequest("/lists", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      return {
        content: [
          {
            type: "text",
            text: `Successfully created list "${newList.name}" with ID: ${newList.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating list: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Add item to list
server.registerTool(
  "add_list_item",
  {
    title: "Add Item to List",
    description: "Add a new item to an existing list",
    inputSchema: {
      list_id: z.number().describe("The ID of the list to add the item to"),
      text: z.string().describe("The text content of the new item"),
      parent_id: z
        .number()
        .nullable()
        .optional()
        .describe("Optional ID of parent item (for nested items)"),
      checked: z
        .boolean()
        .default(false)
        .describe("Whether the item should be marked as completed"),
    },
  },
  async ({ list_id, text, parent_id = null, checked = false }) => {
    try {
      const newItem = await dbRequest(`/lists/${list_id}/items`, {
        method: "POST",
        body: JSON.stringify({ text, parent_id, checked }),
      });

      const parentText = parent_id ? ` as a sub-item of item ${parent_id}` : "";
      const statusText = checked ? " (marked as completed)" : "";

      return {
        content: [
          {
            type: "text",
            text: `Successfully added item "${newItem.text}" to list ${list_id}${parentText}${statusText} (Item ID: ${newItem.id})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error adding item: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Bulk add items to list
server.registerTool(
  "bulk_add_list_items",
  {
    title: "Bulk Add Items to List",
    description: "Add multiple items to an existing list at once",
    inputSchema: {
      list_id: z.number().describe("The ID of the list to add items to"),
      items: z
        .array(
          z.object({
            text: z.string().describe("The text content of the item"),
            parent_id: z
              .number()
              .nullable()
              .optional()
              .describe("Optional ID of parent item (for nested items)"),
            checked: z
              .boolean()
              .default(false)
              .describe("Whether the item should be marked as completed"),
          })
        )
        .describe("Array of items to add"),
    },
  },
  async ({ list_id, items }) => {
    try {
      const results = [];
      const errors = [];

      for (const item of items) {
        try {
          const newItem = await dbRequest(`/lists/${list_id}/items`, {
            method: "POST",
            body: JSON.stringify({
              text: item.text,
              parent_id: item.parent_id || null,
              checked: item.checked || false,
            }),
          });

          const parentText = item.parent_id
            ? ` (nested under item ${item.parent_id})`
            : "";
          const statusText = item.checked ? " (completed)" : "";
          results.push(
            `✅ "${newItem.text}" (ID: ${newItem.id})${parentText}${statusText}`
          );
        } catch (error) {
          errors.push(`❌ Failed to add "${item.text}": ${error.message}`);
        }
      }

      const successCount = results.length;
      const errorCount = errors.length;
      const totalCount = items.length;

      let responseText = `Bulk add completed: ${successCount}/${totalCount} items added successfully\n\n`;

      if (results.length > 0) {
        responseText +=
          "✅ Successfully added:\n" + results.join("\n") + "\n\n";
      }

      if (errors.length > 0) {
        responseText += "❌ Errors:\n" + errors.join("\n");
      }

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
        isError: errorCount > 0,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error during bulk add: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Find list item by text
server.registerTool(
  "find_list_item",
  {
    title: "Find List Item",
    description:
      "Find a list item by searching for text content and get its ID",
    inputSchema: {
      list_id: z.number().describe("The ID of the list to search in"),
      search_text: z
        .string()
        .describe(
          "Text to search for in item names (case-insensitive partial match)"
        ),
    },
  },
  async ({ list_id, search_text }) => {
    try {
      const list = await dbRequest(`/lists/${list_id}`);

      // Flatten the nested items structure to search all items
      function flattenItems(items, result = []) {
        for (const item of items) {
          result.push({
            id: item.id,
            text: item.text,
            checked: item.checked,
            parent_id: item.parent_id,
          });
          if (item.children && item.children.length > 0) {
            flattenItems(item.children, result);
          }
        }
        return result;
      }

      const allItems = flattenItems(list.items || []);
      const searchLower = search_text.toLowerCase();

      // Find items that contain the search text (case-insensitive)
      const matchingItems = allItems.filter((item) =>
        item.text.toLowerCase().includes(searchLower)
      );

      if (matchingItems.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No items found containing "${search_text}" in list "${list.name}" (ID: ${list_id})`,
            },
          ],
        };
      }

      let resultText = `Found ${matchingItems.length} item(s) containing "${search_text}" in list "${list.name}":\n\n`;

      matchingItems.forEach((item, index) => {
        const status = item.checked ? "☑️" : "☐";
        const parentInfo = item.parent_id
          ? ` (nested under item ${item.parent_id})`
          : "";
        resultText += `${index + 1}. ${status} "${item.text}" (ID: ${
          item.id
        })${parentInfo}\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: resultText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding item: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Update item (text or checked status)
server.registerTool(
  "update_list_item",
  {
    title: "Update List Item",
    description: "Update an existing list item's text or completion status",
    inputSchema: {
      list_id: z.number().describe("The ID of the list containing the item"),
      item_id: z.number().describe("The ID of the item to update"),
      text: z
        .string()
        .optional()
        .describe("New text content for the item (optional)"),
      checked: z
        .boolean()
        .optional()
        .describe("New completion status for the item (optional)"),
    },
  },
  async ({ list_id, item_id, text, checked }) => {
    try {
      const updateData = {};
      if (text !== undefined) updateData.text = text;
      if (checked !== undefined) updateData.checked = checked;

      if (Object.keys(updateData).length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No updates specified. Please provide either text or checked status to update.",
            },
          ],
          isError: true,
        };
      }

      const updatedItem = await dbRequest(
        `/lists/${list_id}/items/${item_id}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );

      const changes = [];
      if (text !== undefined) changes.push(`text to "${text}"`);
      if (checked !== undefined)
        changes.push(`status to ${checked ? "completed" : "not completed"}`);

      return {
        content: [
          {
            type: "text",
            text: `Successfully updated item ${item_id}: changed ${changes.join(
              " and "
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating item: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Delete list item
server.registerTool(
  "delete_list_item",
  {
    title: "Delete List Item",
    description: "Delete an item from a list",
    inputSchema: {
      list_id: z.number().describe("The ID of the list containing the item"),
      item_id: z.number().describe("The ID of the item to delete"),
    },
  },
  async ({ list_id, item_id }) => {
    try {
      await dbRequest(`/lists/${list_id}/items/${item_id}`, {
        method: "DELETE",
      });

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted item ${item_id} from list ${list_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting item: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Delete entire list
server.registerTool(
  "delete_list",
  {
    title: "Delete List",
    description: "Delete an entire list and all its items",
    inputSchema: {
      list_id: z.number().describe("The ID of the list to delete"),
    },
  },
  async ({ list_id }) => {
    try {
      await dbRequest(`/lists/${list_id}`, {
        method: "DELETE",
      });

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted list ${list_id} and all its items`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error deleting list: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

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
  console.error("Starting Checklist MCP Server...");
  console.error(`Database server URL: ${DB_SERVER_URL}`);

  // Test connection to database server
  try {
    await dbRequest("/lists");
    console.error("✅ Successfully connected to database server");
  } catch (error) {
    console.error(`❌ Failed to connect to database server: ${error.message}`);
    console.error(
      "Make sure the database server is running on the configured URL"
    );
    process.exit(1);
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

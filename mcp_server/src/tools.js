import { z } from "zod";
import * as config from "./config.js";
import { createGetAllListsTool } from "./tools/get_all_lists.js";
import { createGetListTool } from "./tools/get_list.js";
import { createCreateListTool } from "./tools/create_list.js";
import { createAddListItemTool } from "./tools/add_list_item.js";
import { createBulkAddListItemsTool } from "./tools/bulk_add_list_items.js";
import { createFindListItemTool } from "./tools/find_list_item.js";
import { createUpdateListItemTool } from "./tools/update_list_item.js";
import { createDeleteListItemTool } from "./tools/delete_list_item.js";
import { createDeleteListTool } from "./tools/delete_list.js";

/**
 * Tools module for the MCP Checklist Server
 *
 * This module contains all tool definitions and utility functions
 * used by the MCP server for checklist operations.
 */

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format list items into a hierarchical text representation
 * @param {Array} items - Array of list items
 * @param {number} level - Current nesting level for indentation
 * @returns {string} Formatted text representation
 */
export function formatItems(items, level = 0) {
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

/**
 * Flatten nested items structure into a flat array for searching
 * @param {Array} items - Array of list items with potential nesting
 * @param {Array} result - Accumulator array for flattened items
 * @returns {Array} Flattened array of items
 */
export function flattenItems(items, result = []) {
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

// ========================================
// TOOL REGISTRATION
// ========================================

/**
 * Register all tools with the MCP server
 * @param {Object} server - The MCP server instance
 * @param {Function} dbRequest - Database request helper function
 */
export function registerTools(server, dbRequest) {
  console.log("🛠️ Tools module loaded - registering tools...");

  // Register get_all_lists tool
  const getAllListsTool = createGetAllListsTool(dbRequest);
  server.registerTool(
    getAllListsTool.name,
    getAllListsTool.definition,
    getAllListsTool.handler
  );

  // Register get_list tool
  const getListTool = createGetListTool(dbRequest, formatItems);
  server.registerTool(
    getListTool.name,
    getListTool.definition,
    getListTool.handler
  );

  // Register create_list tool
  const createListTool = createCreateListTool(dbRequest);
  server.registerTool(
    createListTool.name,
    createListTool.definition,
    createListTool.handler
  );

  // Register add_list_item tool
  const addListItemTool = createAddListItemTool(dbRequest);
  server.registerTool(
    addListItemTool.name,
    addListItemTool.definition,
    addListItemTool.handler
  );

  // Register bulk_add_list_items tool
  const bulkAddListItemsTool = createBulkAddListItemsTool(dbRequest);
  server.registerTool(
    bulkAddListItemsTool.name,
    bulkAddListItemsTool.definition,
    bulkAddListItemsTool.handler
  );

  // Register find_list_item tool
  const findListItemTool = createFindListItemTool(dbRequest, flattenItems);
  server.registerTool(
    findListItemTool.name,
    findListItemTool.definition,
    findListItemTool.handler
  );

  // Register update_list_item tool
  const updateListItemTool = createUpdateListItemTool(dbRequest);
  server.registerTool(
    updateListItemTool.name,
    updateListItemTool.definition,
    updateListItemTool.handler
  );

  // Register delete_list_item tool
  const deleteListItemTool = createDeleteListItemTool(dbRequest);
  server.registerTool(
    deleteListItemTool.name,
    deleteListItemTool.definition,
    deleteListItemTool.handler
  );

  // Register delete_list tool
  const deleteListTool = createDeleteListTool(dbRequest);
  server.registerTool(
    deleteListTool.name,
    deleteListTool.definition,
    deleteListTool.handler
  );

  console.log("✅ get_all_lists tool registered");
  console.log("✅ get_list tool registered");
  console.log("✅ create_list tool registered");
  console.log("✅ add_list_item tool registered");
  console.log("✅ bulk_add_list_items tool registered");
  console.log("✅ find_list_item tool registered");
  console.log("✅ update_list_item tool registered");
  console.log("✅ delete_list_item tool registered");
  console.log("✅ delete_list tool registered");
}

// ========================================
// EXPORTS
// ========================================

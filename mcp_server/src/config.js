/**
 * Server configuration and constants
 */

// Environment variables with defaults
export const DB_SERVER_URL =
  process.env.DB_SERVER_URL || "http://localhost:1029";
export const WEB_SERVER_URL =
  process.env.WEB_SERVER_URL || "http://localhost:5173";

// MCP Server configuration
export const MCP_SERVER_CONFIG = {
  name: "checklist-mcp-server",
  version: "1.0.0",
  description:
    "MCP server for checklist management - allows LLMs to read and manage checklist data",
};

// Database request defaults
export const DB_REQUEST_DEFAULTS = {
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // 5 second timeout
};

// Dependency server configurations
export const DEPENDENCY_SERVERS = [
  {
    name: "Database Server",
    command: "node",
    args: ["db_server.js"],
    relativePath: "../db_server",
    healthCheckPath: "/lists",
    startupDelay: 2000,
  },
  {
    name: "Web Server",
    command: "npm",
    args: ["run", "dev"],
    relativePath: "../web_server",
    healthCheckPath: "/",
    startupDelay: 5000, // Web server takes longer to start
  },
];

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Resource URIs
export const RESOURCE_URIS = {
  ALL_LISTS: "checklist://lists/all",
  LIST_DETAIL_TEMPLATE: "checklist://lists/{list_id}",
};

// Tool response templates
export const RESPONSE_TEMPLATES = {
  SUCCESS: (message) => ({
    content: [{ type: "text", text: message }],
  }),
  ERROR: (message) => ({
    content: [{ type: "text", text: message }],
    isError: true,
  }),
  RESOURCE_SUCCESS: (uri, text, mimeType = "text/plain") => ({
    contents: [{ uri, text, mimeType }],
  }),
  RESOURCE_ERROR: (uri, message, mimeType = "text/plain") => ({
    contents: [{ uri, text: `Error: ${message}`, mimeType }],
  }),
};

// Format constants
export const FORMAT_CONSTANTS = {
  CHECKBOX_CHECKED: "☑️",
  CHECKBOX_UNCHECKED: "☐",
  CHECKBOX_CHECKED_MARKDOWN: "[x]",
  CHECKBOX_UNCHECKED_MARKDOWN: "[ ]",
  INDENT: "  ",
  SEPARATOR_LINE: "==========================",
};

// Validation constants
export const VALIDATION = {
  MAX_LIST_NAME_LENGTH: 255,
  MAX_ITEM_TEXT_LENGTH: 1000,
  MAX_BULK_ITEMS: 100,
};

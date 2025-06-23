# Checklist MCP Server

This is a Model Context Protocol (MCP) server that allows LLMs like Claude to interact with your checklist data through a standardized protocol. The server acts as a bridge between LLMs and your checklist database, providing tools for reading and managing checklist data.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables LLM applications to securely connect to external data sources and tools. Instead of a REST API, MCP provides a standardized way for LLMs to:

- **Use Tools**: Execute functions to perform actions (create, read, update, delete operations)
- **Access Resources**: Read contextual data and information
- **Use Prompts**: Get templated interactions for common workflows

## Features

### 🛠️ Tools (Actions LLMs can perform)

- `get_all_lists` - Retrieve all checklist lists with basic information
- `get_list` - Get detailed view of a specific list with all items and hierarchy
- `create_list` - Create a new checklist with specified name
- `add_list_item` - Add items to lists (supports nested items)
- `update_list_item` - Update item text or completion status
- `delete_list_item` - Delete specific items from lists
- `delete_list` - Delete entire lists and all their items

### 📄 Resources (Data LLMs can reference)

- `checklist://lists/all` - Overview of all available checklist lists
- `checklist://lists/{list_id}` - Detailed view of specific lists with items

### 💬 Prompts (Templated interactions)

- `create_list_with_items` - Template for creating and populating new lists
- `list_assistant` - Get help managing and organizing checklists

## Installation

1. Install dependencies:

```bash
npm install
```

2. Make the server executable:

```bash
chmod +x mcp_server.js
```

## Usage

### Prerequisites

The MCP server connects to your existing database server, so make sure:

1. Your database server is running (default: `http://localhost:1029`)
2. Set the `DB_SERVER_URL` environment variable if using a different URL:

```bash
export DB_SERVER_URL=http://localhost:3000
```

### Running the Server

The MCP server uses stdio transport (standard input/output) to communicate with LLM clients:

```bash
node mcp_server.js
```

or

```bash
npm start
```

### Integration with Claude Desktop

To use this MCP server with Claude Desktop, add the following to your Claude Desktop configuration file:

**On macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "checklist": {
      "command": "node",
      "args": ["/path/to/your/mcp_server/mcp_server.js"],
      "env": {
        "DB_SERVER_URL": "http://localhost:1029"
      }
    }
  }
}
```

Replace `/path/to/your/mcp_server/` with the actual path to your MCP server directory.

### Integration with Other MCP Clients

This server implements the standard MCP protocol and can work with any MCP-compatible client. The server uses stdio transport, so clients should connect using:

- **Command**: `node`
- **Args**: `["path/to/mcp_server.js"]`
- **Transport**: stdio

## Example LLM Interactions

Once connected, you can ask the LLM to help with checklist management:

- _"Show me all my lists"_ - Uses `get_all_lists` tool
- _"Create a shopping list with groceries"_ - Uses `create_list` and `add_list_item` tools
- _"Mark the first item in list 1 as completed"_ - Uses `update_list_item` tool
- _"Help me organize my project tasks"_ - Uses the `list_assistant` prompt

The LLM will automatically use the appropriate tools and resources based on your requests.

## Architecture

```
┌─────────────────┐    MCP Protocol    ┌─────────────────┐    HTTP API    ┌─────────────────┐
│   LLM Client    │◄──────────────────►│   MCP Server    │◄──────────────►│  Database Server │
│  (Claude, etc.) │     stdio/tools    │  (this server)  │   REST calls   │   (db_server.js) │
└─────────────────┘                    └─────────────────┘                └─────────────────┘
```

The MCP server acts as a protocol adapter:

1. Receives MCP protocol messages from LLM clients
2. Translates them into HTTP API calls to your database server
3. Formats responses back into MCP protocol format

## Development

### Testing the Server

1. Start your database server:

```bash
cd ../db_server && node db_server.js
```

2. In another terminal, start the MCP server:

```bash
cd mcp_server && node mcp_server.js
```

3. The MCP server will test the connection to the database server on startup

### Debugging

The MCP server logs to stderr (so it doesn't interfere with the MCP protocol on stdout):

- Connection status with database server
- Error messages and troubleshooting info

If you see connection errors, verify:

- Database server is running
- `DB_SERVER_URL` environment variable is correct
- No firewall/network issues

## Protocol Details

This server implements MCP version 2025-03-26 specification:

- **Transport**: stdio (JSON-RPC over stdin/stdout)
- **Capabilities**: tools, resources, prompts
- **Message Format**: JSON-RPC 2.0
- **Error Handling**: Standard MCP error responses

## Contributing

This MCP server is part of the larger checklist application. See the main project README for contribution guidelines.

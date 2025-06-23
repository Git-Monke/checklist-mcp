# Checklist MCP

A modern, hierarchical checklist application with **Model Context Protocol (MCP)** integration, enabling AI assistants like Claude to directly interact with your checklist data.

## 🎯 Overview

Checklist MCP is a full-stack application that combines a beautiful React-based web interface with AI-powered checklist management through the Model Context Protocol. Create, organize, and manage hierarchical task lists while allowing AI assistants to help you stay productive.

### Key Features

- **🌳 Hierarchical Lists**: Unlimited nesting levels for complex project structures
- **🤖 AI Integration**: Direct integration with Claude and other AI assistants via MCP
- **⚡ Real-time Updates**: WebSocket-powered live synchronization across all clients
- **🎨 Modern UI**: Beautiful, responsive interface built with React and shadcn/ui
- **📱 Cross-platform**: Works on desktop and mobile devices
- **🔧 Developer Friendly**: Modular architecture with comprehensive APIs

## 🏗️ Architecture

The application consists of three main components:

```
┌─────────────────┐    WebSocket     ┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Web Client    │◄─────────────────│  Database Server │◄───────────────│   MCP Server    │
│   (React App)   │   Real-time UI   │   (Express.js)  │   REST calls   │  (AI Interface) │
└─────────────────┘                  └─────────────────┘                └─────────────────┘
                                              │                                    │
                                              │                                    │
                                      ┌─────────────────┐                         │
                                      │   SQLite DB     │                         │
                                      │  (Data Storage) │                         │
                                      └─────────────────┘                         │
                                                                                   │
                                      ┌─────────────────┐    MCP Protocol         │
                                      │   AI Assistant  │◄────────────────────────┘
                                      │  (Claude, etc.) │     stdio/tools
                                      └─────────────────┘
```

### Components

- **🖥️ Web Server** (`web_server/`): React + TypeScript frontend with modern UI components
- **💾 Database Server** (`db_server/`): Express.js API with SQLite database and WebSocket support
- **🤖 MCP Server** (`mcp_server/`): Model Context Protocol server for AI assistant integration

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd checklist-mcp
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start all services**:
   ```bash
   npm start
   ```

This will automatically start:

- Database server on `http://localhost:1029`
- Web server on `http://localhost:5173`
- MCP server ready for AI assistant connections

### Access Points

- **Web Interface**: [http://localhost:5173](http://localhost:5173)
- **API Documentation**: [http://localhost:1029](http://localhost:1029)
- **MCP Server**: Available for AI assistant integration

## 🤖 AI Assistant Integration

### Claude Desktop Setup

1. **Locate your Claude Desktop config file**:

   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

2. **Add the MCP server configuration**:

   ```json
   {
     "mcpServers": {
       "checklist": {
         "command": "node",
         "args": ["/path/to/checklist-mcp/mcp_server/mcp_server.js"],
         "env": {
           "DB_SERVER_URL": "http://localhost:1029"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** and start using AI-powered checklist management!

### Example AI Interactions

Once integrated, you can ask Claude:

- _"Show me all my checklists"_
- _"Create a grocery shopping list with common items"_
- _"Add subtasks to my 'Website Project' list for planning, design, and development"_
- _"Mark the first three tasks in my morning routine as completed"_
- _"Help me organize my project into phases with detailed subtasks"_

Claude will automatically use the appropriate tools to manage your checklists.

## 📱 Web Interface Features

### Modern UI Components

- **Sidebar Navigation**: Easy list switching and management
- **Hierarchical Tree View**: Visual nesting with expand/collapse
- **Inline Editing**: Click any item to edit text directly
- **Drag & Drop**: Reorder items and change hierarchy (coming soon)
- **Real-time Updates**: See changes instantly across all devices

### Key Interactions

- **✅ Check/Uncheck**: Click checkboxes to toggle completion
- **➕ Add Items**: Use the "+" button or press Enter after editing
- **📝 Edit Text**: Click any item text to edit inline
- **🗑️ Delete Items**: Use the delete button in item actions
- **📁 Expand/Collapse**: Toggle nested item visibility

## 🛠️ Development

### Project Structure

```
checklist-mcp/
├── web_server/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui + custom)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API communication layer
│   │   ├── store/       # Zustand state management
│   │   └── utils/       # Utility functions
│   └── package.json
├── db_server/           # Express.js API server
│   ├── db_server.js     # Main server file
│   ├── migrations/      # Database schema migrations
│   └── package.json
├── mcp_server/          # Model Context Protocol server
│   ├── src/
│   │   ├── tools/       # Individual MCP tool implementations
│   │   ├── config.js    # Configuration management
│   │   └── dependency-manager.js  # Service orchestration
│   ├── mcp_server.js    # Main MCP server
│   └── package.json
└── package.json         # Root package with start scripts
```

### Running Individual Services

**Database Server**:

```bash
cd db_server
npm install
npm start  # Runs on http://localhost:1029
```

**Web Server**:

```bash
cd web_server
npm install
npm run dev  # Runs on http://localhost:5173
```

**MCP Server**:

```bash
cd mcp_server
npm install
node mcp_server.js  # Stdio transport for AI assistants
```

### Development Features

- **🔄 Auto-Dependency Management**: MCP server automatically starts required services
- **🔧 Modular Architecture**: Clean separation of concerns across all components
- **📡 WebSocket Support**: Real-time synchronization between web clients
- **🧪 Comprehensive Testing**: Live testing protocols for all MCP tools
- **📝 TypeScript**: Full type safety in frontend components

## 🗄️ Database Schema

The application uses SQLite with the following core tables:

```sql
-- Lists table
CREATE TABLE lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- List items table with hierarchical support
CREATE TABLE list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    parent_id INTEGER,
    text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES list_items(id) ON DELETE CASCADE
);
```

## 🔌 API Reference

### REST Endpoints

- **GET** `/lists` - Get all lists
- **POST** `/lists` - Create a new list
- **GET** `/lists/:id` - Get specific list with items
- **DELETE** `/lists/:id` - Delete a list
- **POST** `/lists/:id/items` - Add item to list
- **PUT** `/lists/:id/items/:itemId` - Update list item
- **DELETE** `/lists/:id/items/:itemId` - Delete list item

### WebSocket Events

- **`lists_updated`** - Broadcast when any list data changes
- **Connection management** - Automatic reconnection and error handling

### MCP Tools

- **`get_all_lists`** - Retrieve all checklist lists
- **`get_list`** - Get detailed list with hierarchy
- **`create_list`** - Create new checklists
- **`add_list_item`** - Add items with nesting support
- **`bulk_add_list_items`** - Add multiple items at once
- **`find_list_item`** - Search items by text
- **`update_list_item`** - Update text or completion status
- **`delete_list_item`** - Delete specific items
- **`delete_list`** - Delete entire lists

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure all services work together correctly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [Claude Desktop](https://claude.ai/desktop) - AI assistant with MCP support
- [shadcn/ui](https://ui.shadcn.com/) - UI component library used in the frontend

---

**Built with ❤️ for AI-assisted productivity**

# Changelog

## [June 23, 2025] - MCP Server Complete & Enhanced

### Added

- **Model Context Protocol (MCP) Server Implementation**
  - Created proper MCP server using official `@modelcontextprotocol/sdk` for LLM integration
  - Implements full MCP specification with tools, resources, and prompts
  - **Enhanced Tools**: 9 comprehensive tools for complete checklist management
    - `get_all_lists` - Retrieve all checklists
    - `get_list` - Get detailed list with hierarchical items
    - `create_list` - Create new checklists
    - `add_list_item` - Add single items with nesting support
    - `bulk_add_list_items` - **NEW**: Add multiple items at once with parent/child relationships
    - `find_list_item` - **NEW**: Search for items by text and get IDs for nesting operations
    - `update_list_item` - Update item text/completion status
    - `delete_list_item` - Delete items
    - `delete_list` - Delete entire lists
  - **Resources**: Dynamic resources for accessing list data (`checklist://lists/all`, `checklist://lists/{id}`)
  - **Prompts**: Templated interactions for creating lists and getting assistance
  - Uses stdio transport for standard MCP client compatibility
  - Comprehensive error handling and validation
  - **Cursor IDE Integration**: Complete setup guide and configuration files (`.vscode/mcp.json`)
  - **Claude Desktop Integration**: Proper `mcpServers` configuration format (`claude_desktop_config.json`)
  - **Multi-client Support**: Works with any MCP-compatible client (Cursor, Claude Desktop, VS Code)
  - **Full Testing**: All 9 tools working and tested with JSON-RPC communication
  - **Complete Documentation**: Setup guides, test scripts, and troubleshooting information

### Enhanced

- **Code Architecture Improvements**
  - Created centralized API service layer (`src/services/api.ts`) to consolidate all HTTP calls
  - Refactored store to use API service instead of direct fetch calls throughout
  - Improved error handling with custom `ApiError` class and consistent error messaging
  - Enhanced code maintainability and reusability by separating concerns
  - Better TypeScript typing with proper API interfaces and response types
- **Smart List Selection Management**
  - Auto-selection of first available list when currently selected list is deleted
  - Graceful handling of empty list states (selects null when no lists exist)
  - Prevents broken UI state when lists are removed
- **Advanced Hierarchical Task Management**
  - Support for unlimited nesting levels (tested up to 4 levels deep)
  - Bulk operations with parent-child relationships
  - Intelligent item search and ID resolution for nesting
  - Complex project structures with nested subtasks
- **Real-world Testing Implementation**
  - Created comprehensive "Search Implementation" project structure
  - Built detailed "Search Testing" hierarchy with multiple nested levels:
    - Basic functionality testing (10 detailed test cases)
    - Performance testing (8 comprehensive benchmarks)
    - Filter validation (10 filter types with deep priority testing breakdown)
    - Mobile testing preparation
    - Results accuracy validation
  - Demonstrated 4-level nesting: Project → Category → Test Type → Individual Tests
- **Improved Developer Experience**
  - Resolved schema validation issues with proper Zod usage
  - Enhanced error reporting and debugging capabilities
  - Auto-run safety with recommended allowlists for read-only operations
  - Seamless integration between bulk operations and real-time WebSocket updates

## [Previous Updates] - Sun Jun 22

### Added

- Initial SQLite database setup with migration support and schema for lists and list items.
- Express.js API with full CRUD endpoints for lists and list items, including:
  - `/lists` and `/lists/:id`
  - `/lists/:id/items` and `/lists/:id/items/:itemId`
- CORS support for cross-origin requests from the frontend.
- WebSocket server for real-time update notifications (`lists_updated` broadcast on changes).
- Logging middleware for HTTP and WebSocket connections.
- `buildListItemTree` utility to return list items as a tree structure, now including `parent_id` in each item.

### Changed

- Refactored API to always return list items as a tree under each list.
- Improved error handling and status codes for all endpoints.
- Added request/response logging for easier debugging.
- Updated polling and state management in the frontend to always fetch the latest data after any mutation and at regular intervals.
- Switched frontend state management to Zustand, with auto-refresh and per-list fetching for efficient updates.
- Sidebar and main content UI now reflect selected list and list items, with inline editing and adding of items.
- Modularized frontend components for sidebar, list tree, and editing.

### Fixed

- Ensured all list item CRUD operations update the frontend state and reflect changes immediately.
- Fixed CORS issues preventing frontend-backend communication.
- Fixed issues with stale data by always fetching the latest list after item mutations.

### Removed

- TypeScript from the backend for simplicity and easier deployment.

---

**Note:**

- The backend now runs on port 1029 and supports both HTTP and WebSocket connections.
- The frontend auto-refreshes list data and supports real-time updates in the future.

## Mon Jun 23

- Added WebSocket support to db_server for real-time updates.
- Implemented precise WebSocket messages for list and list item changes.
- Updated useListStore to use WebSocket for all data refreshes (removed polling and manual fetches after mutations).
- Improved error handling and reconnect logic for WebSocket in useListStore.
- Refactored UI to support real-time, cascading updates and animations.
- Various bug fixes and UI improvements for list item handling and animation.

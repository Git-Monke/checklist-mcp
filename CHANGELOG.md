# Changelog

## [Unreleased] - Sun Jun 22

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

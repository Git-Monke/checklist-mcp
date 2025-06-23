import type { List, BuiltListItem } from '../store/useListStore';

// Set the backend port here for easy configuration
const PORT = 1029;
const BASE_URL = `http://localhost:${PORT}`;

// Generic API error handler
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, `Request failed: ${response.status}`);
  }
  return response.json();
}

// Helper function for making requests with common options
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  return handleResponse<T>(response);
}

// Lists API
export const listsApi = {
  // Get all lists (metadata only, no items)
  getAll: (): Promise<List[]> => 
    apiRequest('/lists'),

  // Get specific list with all its items
  getById: (id: number): Promise<List> => 
    apiRequest(`/lists/${id}`),

  // Create new list
  create: (name: string): Promise<List> => 
    apiRequest('/lists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Update list metadata
  update: (id: number, data: { name: string }): Promise<List> => 
    apiRequest(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete list
  delete: (id: number): Promise<{ success: boolean }> => 
    apiRequest(`/lists/${id}`, {
      method: 'DELETE',
    }),
};

// List Items API
export const listItemsApi = {
  // Get all items for a list
  getAll: (listId: number): Promise<BuiltListItem[]> => 
    apiRequest(`/lists/${listId}/items`),

  // Get specific item
  getById: (listId: number, itemId: number): Promise<BuiltListItem> => 
    apiRequest(`/lists/${listId}/items/${itemId}`),

  // Create new item
  create: (
    listId: number, 
    data: { text: string; checked?: boolean; parent_id?: number | null }
  ): Promise<BuiltListItem> => 
    apiRequest(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update item
  update: (
    listId: number, 
    itemId: number, 
    data: { text?: string; checked?: boolean; parent_id?: number | null }
  ): Promise<BuiltListItem> => 
    apiRequest(`/lists/${listId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete item
  delete: (listId: number, itemId: number): Promise<{ success: boolean }> => 
    apiRequest(`/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    }),
};

// Combined API object for convenience
export const api = {
  lists: listsApi,
  items: listItemsApi,
};

// Export types for consumers
export { ApiError }; 
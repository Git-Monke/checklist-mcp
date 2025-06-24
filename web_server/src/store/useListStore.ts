// If you see a 'Cannot find module "zustand"' error, run:
// npm install zustand
// npm install --save-dev @types/zustand

import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { createWebSocketConnection } from '../utils/websocket';
import { api, ApiError } from '../services/api';

// Types
export interface BuiltListItem {
  id: number;
  text: string;
  checked: boolean;
  parent_id?: number | null;
  children: BuiltListItem[];
}

export interface List {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  items: BuiltListItem[];
}

interface ListStoreState {
  lists: List[];
  loading: boolean;
  error: string | null;
  selectedListId: number | null;
  selectList: (id: number | null) => void;
  fetchLists: () => Promise<void>;
  createList: (name: string) => Promise<List>;
  updateList: (id: number, data: Partial<Omit<List, 'id' | 'items'>>) => Promise<void>;
  deleteList: (id: number) => Promise<void>;
  createListItem: (listId: number, data: Partial<BuiltListItem>) => Promise<void>;
  updateListItem: (listId: number, itemId: number, data: Partial<BuiltListItem>) => Promise<void>;
  deleteListItem: (listId: number, itemId: number) => Promise<void>;
  fetchListById: (id: number) => Promise<void>;
}

export const useListStore = create<ListStoreState>(((set, get) => {
  // Initialize WebSocket connection using the utility
  const wsConnection = createWebSocketConnection({
    url: `ws://localhost:1029`,
    onMessage: (event) => {
      const msg = event.data;

      if (msg === 'lists_updated') {
        get().fetchLists();
      } else if (msg.startsWith('list_updated:')) {
        const id = parseInt(msg.split(':')[1], 10);

        if (!isNaN(id)) {
          get().fetchListById(id);
        }
      }
    },
    onOpen: () => {
      set({ error: null }); // Clear error on successful connect
    },
    onError: () => {
      set({ error: 'WebSocket error: connection lost' });
    },
    onClose: () => {
      set({ error: 'WebSocket closed. Attempting to reconnect...' });
    }
  });

  // Scaffolded actions
  const fetchLists = async () => {
    set({ loading: true, error: null });
    try {
      const lists = await api.lists.getAll();
      const currentLists = get().lists;

      // Merge new metadata with existing items (if any)
      const mergedLists = lists.map((newList) => {
        const existing = currentLists.find((l) => l.id === newList.id);
        return existing && existing.items
          ? { ...newList, items: existing.items }
          : { ...newList, items: [] };
      });

      // Check if the currently selected list still exists
      const currentState = get();
      const selectedListStillExists = currentState.selectedListId && 
        mergedLists.some((list) => list.id === currentState.selectedListId);

      set({
        lists: mergedLists,
        loading: false,
        error: null,
        selectedListId: selectedListStillExists ? currentState.selectedListId : null
      });
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to fetch lists: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  };

  const createList = async (name: string): Promise<List> => {
    set({ loading: true, error: null });
    try {
      const newList = await api.lists.create(name);
      set({ loading: false });
      // WebSocket will handle the lists update
      return newList;
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to create list: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
      throw err;
    }
  };

  const updateList = async (id: number, data: Partial<Omit<List, 'id' | 'items'>>) => {
    set({ loading: true, error: null });
    try {
      await api.lists.update(id, data as { name: string });
      set({ loading: false });
      // WebSocket will handle the lists update
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to update list: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  };

  const deleteList = async (id: number) => {
    set({ loading: true, error: null });
    try {
      await api.lists.delete(id);
      
      // Just clear loading state - WebSocket will handle the update and selection logic
      set({ loading: false });
      
      // WebSocket will handle the lists update and smart selection via fetchLists
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to delete list: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  };

  const fetchListById = async (id: number) => {
    set({ loading: true, error: null });
    try {
      const list = await api.lists.getById(id);
      set((state: ListStoreState) => ({
        lists: state.lists.map(l => l.id === id ? list : l),
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to fetch list: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  };

  const createListItem = async (listId: number, data: Partial<BuiltListItem>) => {
    set({ loading: true, error: null });
    try {
      await api.items.create(listId, {
        text: data.text || '',
        checked: data.checked,
        parent_id: data.parent_id
      });
      set({ loading: false });
      // WebSocket will handle the list update
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to create list item: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  };

  const updateListItem = async (listId: number, itemId: number, data: Partial<BuiltListItem>) => {
    set({ loading: true, error: null });
    try {
      await api.items.update(listId, itemId, {
        text: data.text,
        checked: data.checked,
        parent_id: data.parent_id
      });
      set({ loading: false });
      // WebSocket will handle the list update
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to update list item: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  };

  const deleteListItem = async (listId: number, itemId: number) => {
    set({ loading: true, error: null });
    try {
      await api.items.delete(listId, itemId);
      set({ loading: false });
      // WebSocket will handle the list update
    } catch (err: any) {
      const errorMessage = err instanceof ApiError 
        ? `Failed to delete list item: ${err.status}` 
        : err.message || "Unknown error";
      set({ error: errorMessage, loading: false });
    }
  };

  const selectList = (id: number | null) => {
    set((state: ListStoreState) => {
      if (id === null) {
        return { selectedListId: null };
      }

      const selected = state.lists.find(l => l.id === id);

      if (!selected || !selected.items || selected.items.length === 0) {
        fetchListById(id);
      }

      return { selectedListId: id };
    });
  };

  return {
    lists: [],
    loading: false,
    error: null,
    selectedListId: null,
    selectList,
    fetchLists,
    createList,
    updateList,
    deleteList,
    createListItem,
    updateListItem,
    deleteListItem,
    fetchListById,
  };
}) as StateCreator<ListStoreState>);

export type { ListStoreState }; 
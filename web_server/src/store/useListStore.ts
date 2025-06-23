// If you see a 'Cannot find module "zustand"' error, run:
// npm install zustand
// npm install --save-dev @types/zustand

import { create, StateCreator } from 'zustand';

// Set the backend port here for easy configuration
const PORT = 1029;

// Types
export interface BuiltListItem {
  id: number;
  text: string;
  checked: boolean;
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
  selectList: (id: number) => void;
  fetchLists: () => Promise<void>;
  createList: (name: string) => Promise<void>;
  updateList: (id: number, data: Partial<Omit<List, 'id' | 'items'>>) => Promise<void>;
  deleteList: (id: number) => Promise<void>;
  createListItem: (listId: number, data: Partial<BuiltListItem>) => Promise<void>;
  updateListItem: (listId: number, itemId: number, data: Partial<BuiltListItem>) => Promise<void>;
  deleteListItem: (listId: number, itemId: number) => Promise<void>;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
  fetchListById: (id: number) => Promise<void>;
}

export const useListStore = create<ListStoreState>(((set, get) => {
  // Scaffolded actions
  const fetchLists = async () => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:${PORT}/lists`);

      if (!res.ok) throw new Error(`Failed to fetch lists: ${res.status}`);

      const lists = await res.json();
      set({ lists, loading: false, error: null });
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };

  const createList = async (name: string) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:${PORT}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error(`Failed to create list: ${res.status}`);
      await fetchLists();
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };

  const updateList = async (id: number, data: Partial<Omit<List, 'id' | 'items'>>) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:${PORT}/lists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Failed to update list: ${res.status}`);

      await fetchLists();
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };

  const deleteList = async (id: number) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:${PORT}/lists/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Failed to delete list: ${res.status}`);

      await fetchLists();
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };

  const fetchListById = async (id: number) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`http://localhost:${PORT}/lists/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch list: ${res.status}`);
      const list = await res.json();
      set((state: ListStoreState) => ({
        lists: state.lists.map(l => l.id === id ? list : l),
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };

  const createListItem = async (listId: number, data: Partial<BuiltListItem>) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:${PORT}/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Failed to create list item: ${res.status}`);

      await fetchListById(listId);
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };
  const updateListItem = async (listId: number, itemId: number, data: Partial<BuiltListItem>) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:${PORT}/lists/${listId}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`Failed to update list item: ${res.status}`);

      await fetchListById(listId);
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };

  const deleteListItem = async (listId: number, itemId: number) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:${PORT}/lists/${listId}/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Failed to delete list item: ${res.status}`);

      await fetchListById(listId);
    } catch (err: any) {
      set({ error: err.message || "Unknown error", loading: false });
    }
  };

  const selectList = (id: number) => {
    set((state: ListStoreState) => {
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
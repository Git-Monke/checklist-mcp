import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import { useListStore } from "./store/useListStore";
import type { List, ListStoreState } from "./store/useListStore";
import { useEffect } from "react";
import ListItemsTree from "./components/ListItemsTree";

function AppContent() {
  const error = useListStore((s: ListStoreState) => s.error);
  const selectedList = useListStore((s: ListStoreState) =>
    s.lists.find((list: List) => list.id === s.selectedListId)
  );

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-bold">List Manager</h1>
      </header>
      <main>
        <h1 className="text-2xl font-bold">{selectedList?.name}</h1>
        {error && (
          <div className="my-4 rounded bg-red-100 px-4 py-2 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        <ListItemsTree />
      </main>
    </div>
  );
}

function App() {
  const fetchLists = useListStore((s: ListStoreState) => s.fetchLists);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <AppContent />
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;

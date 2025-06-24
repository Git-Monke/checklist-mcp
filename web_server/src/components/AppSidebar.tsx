import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useListStore } from "../store/useListStore";
import type { List, ListStoreState } from "../store/useListStore";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

function AppSidebar() {
  const lists = useListStore((s: { lists: List[] }) => s.lists);
  const createList = useListStore((s: ListStoreState) => s.createList);
  const deleteList = useListStore((s: ListStoreState) => s.deleteList);
  const selectList = useListStore((s: ListStoreState) => s.selectList);
  const selectedListId = useListStore((s: ListStoreState) => s.selectedListId);
  const error = useListStore((s: ListStoreState) => s.error);

  const [hoveredListId, setHoveredListId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<List | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const handleAddList = () => {
    setCreateDialogOpen(true);
  };

  const confirmCreateList = async () => {
    if (newListName.trim()) {
      const newList = await createList(newListName.trim());
      selectList(newList.id);
      setCreateDialogOpen(false);
      setNewListName("");
    }
  };

  const cancelCreateList = () => {
    setCreateDialogOpen(false);
    setNewListName("");
  };

  const handleDeleteList = (e: React.MouseEvent, list: List) => {
    e.stopPropagation(); // Prevent list selection when clicking delete
    setListToDelete(list);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteList = async () => {
    if (listToDelete) {
      await deleteList(listToDelete.id);
      // Store will automatically handle selecting a new list via WebSocket update
      setDeleteDialogOpen(false);
      setListToDelete(null);
    }
  };

  const cancelDeleteList = () => {
    setDeleteDialogOpen(false);
    setListToDelete(null);
  };

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Lists</SidebarGroupLabel>
          {error && (
            <div className="my-2 rounded bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}
          <SidebarMenu>
            {lists.map((list: List) => (
              <SidebarMenuItem
                key={list.id}
                onMouseEnter={() => setHoveredListId(list.id)}
                onMouseLeave={() => setHoveredListId(null)}
                className="relative group"
              >
                <SidebarMenuButton
                  isActive={selectedListId === list.id}
                  onClick={() => selectList(list.id)}
                  className="w-full justify-between"
                >
                  <span>{list.name}</span>
                  {hoveredListId === list.id && (
                    <button
                      onClick={(e) => handleDeleteList(e, list)}
                      className="ml-2 p-1 rounded hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete list"
                    >
                      <Trash2Icon className="h-3 w-3" />
                    </button>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleAddList}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add List
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{listToDelete?.name}"? This
              action cannot be undone and will permanently delete all items in
              this list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteList}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteList}>
              Delete List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Enter a name for your new checklist.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="List name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  confirmCreateList();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelCreateList}>
              Cancel
            </Button>
            <Button onClick={confirmCreateList} disabled={!newListName.trim()}>
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

export default AppSidebar;

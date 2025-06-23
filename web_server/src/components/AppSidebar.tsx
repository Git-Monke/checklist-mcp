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
import { useListStore } from "../store/useListStore";
import type { List, ListStoreState } from "../store/useListStore";

function AppSidebar() {
  const lists = useListStore((s: { lists: List[] }) => s.lists);
  const createList = useListStore((s: ListStoreState) => s.createList);
  const selectList = useListStore((s: ListStoreState) => s.selectList);
  const selectedListId = useListStore((s: ListStoreState) => s.selectedListId);
  const error = useListStore((s: ListStoreState) => s.error);

  const handleAddList = async () => {
    const name = window.prompt("Enter new list name:");
    if (name && name.trim()) {
      await createList(name.trim());
    }
  };

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Lists
            <button
              className="ml-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/80"
              onClick={handleAddList}
              type="button"
            >
              Add List
            </button>
          </SidebarGroupLabel>
          {error && (
            <div className="my-2 rounded bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}
          <SidebarMenu>
            {lists.map((list: List) => (
              <SidebarMenuItem key={list.id}>
                <SidebarMenuButton
                  isActive={selectedListId === list.id}
                  onClick={() => selectList(list.id)}
                >
                  {list.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;

import React from "react";
import { useListStore } from "../store/useListStore";
import type { BuiltListItem, ListStoreState } from "../store/useListStore";
import { motion, AnimatePresence } from "framer-motion";
import { ListItemNode } from "./ListItemNode";
import { AddItemInput } from "./AddItemInput";

function ListItemsTree() {
  const selectedList = useListStore((s: ListStoreState) =>
    s.lists.find((l) => l.id == s.selectedListId)
  );

  if (!selectedList) return null;

  return (
    <div className="flex flex-col gap-4 justify-start">
      <ListItemNodes items={selectedList.items} listId={selectedList.id} />
      <AddItemInput listId={selectedList.id} parentId={null} showing={true} />
    </div>
  );
}

// Helper to find an item by id in a tree
function findItemById(
  items: BuiltListItem[],
  id: number
): BuiltListItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function ListItemNodes({
  items,
  listId,
  parentId,
  isShowing = true,
}: {
  items: BuiltListItem[];
  listId: number;
  parentId?: number | null;
  isShowing?: boolean;
}) {
  const deleteListItem = useListStore((s: ListStoreState) => s.deleteListItem);

  return (
    <AnimatePresence initial={false}>
      {isShowing && (
        <div>
          <ul className="pl-8">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <AnimtedListItemNode key={parentId + "_" + item.id}>
                  <ListItemNode
                    listId={listId}
                    item={item}
                    deleteListItem={deleteListItem}
                    ListItemNodes={ListItemNodes}
                  />
                </AnimtedListItemNode>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </AnimatePresence>
  );
}

function AnimtedListItemNode({ children }: { children: React.ReactNode }) {
  return (
    <motion.li
      className="relative"
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: "auto",
        opacity: 1,
        transition: {
          type: "spring",
          bounce: 0.3,
          opacity: { delay: 0.1 },
        },
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        type: "spring",
        bounce: 0,
        opacity: { duration: 0.1 },
      }}
    >
      {children}
    </motion.li>
  );
}

export default ListItemsTree;

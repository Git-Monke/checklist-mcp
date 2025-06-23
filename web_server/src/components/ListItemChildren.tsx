import React from "react";
import type { BuiltListItem } from "../store/useListStore";
import { motion } from "framer-motion";

interface ListItemChildrenProps {
  hasChildren: boolean;
  expanded: boolean;
  children: BuiltListItem[];
  listId: number;
  parentId: number;
  ListItemNodes?: React.ComponentType<{
    items: BuiltListItem[];
    listId: number;
    parentId?: number | null;
    isShowing?: boolean;
  }>;
}

export function ListItemChildren({
  hasChildren,
  expanded,
  children,
  listId,
  parentId,
  ListItemNodes,
}: ListItemChildrenProps) {
  if (!hasChildren || !ListItemNodes) {
    return null;
  }

  return (
    <motion.div
      initial={false}
      animate={
        expanded ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }
      }
      transition={{ duration: 0.2, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <ListItemNodes
        items={children}
        listId={listId}
        parentId={parentId}
        isShowing={true}
      />
    </motion.div>
  );
}

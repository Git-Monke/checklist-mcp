import React, { useState } from "react";
import { useListStore } from "../store/useListStore";
import type { BuiltListItem, ListStoreState } from "../store/useListStore";
import { Checkbox } from "./ui/checkbox";
import { InlineEditText } from "./InlineEditText";
import { ListItemChildren } from "./ListItemChildren";
import { ListItemActions } from "./ListItemActions";

interface ListItemNodeProps {
  listId: number;
  item: BuiltListItem;
  deleteListItem: (listId: number, itemId: number) => void;
  ListItemNodes?: React.ComponentType<{
    items: BuiltListItem[];
    listId: number;
    parentId?: number | null;
    isShowing?: boolean;
  }>;
}

export function ListItemNode({
  listId,
  item,
  deleteListItem,
  ListItemNodes,
}: ListItemNodeProps) {
  const [hovering, setHovering] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true); // expanded by default
  const updateListItem = useListStore((s: ListStoreState) => s.updateListItem);

  const copyItemInfo = async () => {
    const itemInfo = `Take item #${item.id} ("${item.text}") from list ${listId} and create specific sub-tasks for it. Each sub-task should be a concrete, actionable step. Do not modify the original item unless the user asks you to.`;

    try {
      await navigator.clipboard.writeText(itemInfo);
      console.log("Copied to clipboard:", itemInfo);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (deleting) return;
    setDeleting(true);
    deleteListItem(listId, item.id);
  };

  const hasChildren = item.children && item.children.length > 0;

  return (
    <>
      <div
        className="flex flex-row gap-16 justify-between"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => {
          if (deleting) return;
          updateListItem(listId, item.id, { checked: !item.checked });
        }}
      >
        <div className="flex flex-row gap-4 items-center">
          <Checkbox
            checked={item.checked}
            onCheckedChange={async (checked) => {
              if (deleting) return;
              await updateListItem(listId, item.id, {
                checked: checked === true,
              });
            }}
          />
          <InlineEditText
            value={item.text}
            onSave={async (text) => {
              if (text !== item.text) {
                if (deleting) return;
                await updateListItem(listId, item.id, { text });
              }
            }}
            checked={item.checked}
          />
        </div>
        <ListItemActions
          listId={listId}
          item={item}
          hovering={hovering}
          deleting={deleting}
          expanded={expanded}
          hasChildren={hasChildren}
          onCopy={copyItemInfo}
          onDelete={handleDelete}
          onToggleExpanded={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!hasChildren) return;
            setExpanded((exp) => !exp);
          }}
        />
      </div>
      <ListItemChildren
        hasChildren={hasChildren}
        expanded={expanded}
        children={item.children}
        listId={listId}
        parentId={item.id}
        ListItemNodes={ListItemNodes}
      />
    </>
  );
}

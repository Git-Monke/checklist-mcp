import React from "react";
import type { BuiltListItem } from "../store/useListStore";
import { Button } from "./ui/button";
import {
  Trash2Icon,
  CopyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { AddItemInput } from "./AddItemInput";

interface ListItemActionsProps {
  listId: number;
  item: BuiltListItem;
  hovering: boolean;
  deleting: boolean;
  expanded: boolean;
  hasChildren: boolean;
  onCopy: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleExpanded: (e: React.MouseEvent) => void;
}

export function ListItemActions({
  listId,
  item,
  hovering,
  deleting,
  expanded,
  hasChildren,
  onCopy,
  onDelete,
  onToggleExpanded,
}: ListItemActionsProps) {
  return (
    <div className="flex flex-row gap-4 items-center">
      <AddItemInput listId={listId} parentId={item.id} showing={hovering} />
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (deleting) return;
          onCopy();
        }}
        className={`${hovering ? "opacity-100" : "opacity-0"}`}
        title="Copy item info to clipboard"
      >
        <CopyIcon className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className={`${hovering ? "opacity-100" : "opacity-0"}`}
        title={deleting ? "Deleting..." : "Delete item"}
        disabled={deleting}
      >
        <Trash2Icon className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleExpanded}
        className={`transition-opacity ${
          hasChildren
            ? hovering
              ? "opacity-100"
              : "opacity-60"
            : "opacity-0 pointer-events-none"
        }`}
        title={expanded ? "Collapse" : "Expand"}
        tabIndex={hasChildren ? 0 : -1}
        aria-hidden={!hasChildren}
      >
        {expanded ? (
          <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 transition-transform duration-200" />
        )}
      </Button>
    </div>
  );
}

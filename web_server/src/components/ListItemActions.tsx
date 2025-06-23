import React, { useState } from "react";
import type { BuiltListItem } from "../store/useListStore";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Trash2Icon,
  CopyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExpandIcon,
  FileTextIcon,
} from "lucide-react";
import { AddItemInput } from "./AddItemInput";

interface ListItemActionsProps {
  listId: number;
  item: BuiltListItem;
  hovering: boolean;
  deleting: boolean;
  expanded: boolean;
  hasChildren: boolean;
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
  onDelete,
  onToggleExpanded,
}: ListItemActionsProps) {
  const [copyPopoverOpen, setCopyPopoverOpen] = useState(false);

  const copyExpandPrompt = async () => {
    const expandPrompt = `Take item #${item.id} ("${item.text}") from list ${listId} and create specific sub-tasks for it. Each sub-task should be a concrete, actionable step. Do not modify the original item unless the user asks you to.`;

    try {
      await navigator.clipboard.writeText(expandPrompt);
      console.log("Copied expand prompt to clipboard:", expandPrompt);
      setCopyPopoverOpen(false);
    } catch (err) {
      console.error("Failed to copy expand prompt to clipboard:", err);
    }
  };

  const copyGeneralInfo = async () => {
    const generalInfo = `List ID: ${listId}, Item ID: ${item.id}, Text: "${item.text}"`;

    try {
      await navigator.clipboard.writeText(generalInfo);
      console.log("Copied general info to clipboard:", generalInfo);
      setCopyPopoverOpen(false);
    } catch (err) {
      console.error("Failed to copy general info to clipboard:", err);
    }
  };

  return (
    <div className="flex flex-row gap-4 items-center">
      <AddItemInput listId={listId} parentId={item.id} showing={hovering} />

      <Popover open={copyPopoverOpen} onOpenChange={setCopyPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (deleting) return;
              setCopyPopoverOpen(true);
            }}
            className={`${hovering ? "opacity-100" : "opacity-0"}`}
            title="Copy item information"
          >
            <CopyIcon className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Copy Options
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                copyExpandPrompt();
              }}
              className="justify-start h-auto p-3 text-left"
            >
              <ExpandIcon className="w-4 h-4 mr-3 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <div className="font-medium">Expand Task</div>
                <div className="text-xs text-muted-foreground">
                  Copy prompt to create sub-tasks
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                copyGeneralInfo();
              }}
              className="justify-start h-auto p-3 text-left"
            >
              <FileTextIcon className="w-4 h-4 mr-3 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <div className="font-medium">General Info</div>
                <div className="text-xs text-muted-foreground">
                  Copy IDs and text for prompting
                </div>
              </div>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

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

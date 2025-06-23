import React, { useState } from "react";
import { useListStore } from "../store/useListStore";
import type { BuiltListItem, ListStoreState } from "../store/useListStore";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { PlusIcon } from "lucide-react";

// Extend BuiltListItem for creation to allow parent_id
interface BuiltListItemWithParent extends BuiltListItem {
  parent_id?: number | null;
}

interface AddItemInputProps {
  listId: number;
  parentId: number | null;
  showing: boolean;
}

export function AddItemInput({ listId, parentId, showing }: AddItemInputProps) {
  const createListItem = useListStore((s: ListStoreState) => s.createListItem);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const handleAdd = async () => {
    if (text.trim()) {
      await createListItem(listId, {
        text: text.trim(),
        parent_id: parentId,
      } as Partial<BuiltListItemWithParent>);
      setText("");
      setAdding(false);
    }
  };

  const handleBlur = () => {
    setAdding(false);
  };

  if (!adding) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setAdding(true);
        }}
        className={`${showing ? "opacity-100" : "opacity-0"}`}
      >
        <PlusIcon className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Input
      className="ml-2 inline-block w-auto text-xs"
      value={text}
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onBlur={handleBlur}
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          await handleAdd();
        }
      }}
      placeholder="New item"
    />
  );
}

import React, { useState } from "react";
import { useListStore } from "../store/useListStore";
import type {
  List,
  BuiltListItem,
  ListStoreState,
} from "../store/useListStore";
import { Input } from "./ui/input";

// Extend BuiltListItem for creation to allow parent_id
interface BuiltListItemWithParent extends BuiltListItem {
  parent_id?: number | null;
}

function ListItemsTree() {
  const selectedList = useListStore((s: ListStoreState) =>
    s.lists.find((l) => l.id == s.selectedListId)
  );

  if (!selectedList) return null;

  return (
    <div>
      <ListItemNodes items={selectedList.items} listId={selectedList.id} />
      <AddItemInput listId={selectedList.id} parentId={null} />
    </div>
  );
}

function ListItemNodes({
  items,
  listId,
  parentId,
}: {
  items: BuiltListItem[];
  listId: number;
  parentId?: number | null;
}) {
  const createListItem = useListStore((s: ListStoreState) => s.createListItem);
  const updateListItem = useListStore((s: ListStoreState) => s.updateListItem);
  const deleteListItem = useListStore((s: ListStoreState) => s.deleteListItem);

  if (!items || items.length === 0) return null;
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <InlineEditText
            value={item.text}
            onSave={async (text) => {
              if (text !== item.text) {
                await updateListItem(listId, item.id, { text });
              }
            }}
          />
          {item.children && item.children.length > 0 && (
            <ListItemNodes
              items={item.children}
              listId={listId}
              parentId={item.id}
            />
          )}
          <AddItemInput listId={listId} parentId={item.id} />
          <button
            className="ml-2 text-xs text-red-500 hover:underline"
            onClick={() => deleteListItem(listId, item.id)}
            title="Delete item"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

function InlineEditText({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  const handleBlurOrEnter = async () => {
    setEditing(false);
    if (text.trim() && text !== value) {
      await onSave(text.trim());
    }
  };

  return editing ? (
    <Input
      className="inline-block w-auto text-sm"
      value={text}
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlurOrEnter}
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          await handleBlurOrEnter();
        }
      }}
    />
  ) : (
    <span
      className="cursor-pointer text-sm hover:underline"
      onClick={() => setEditing(true)}
    >
      {value}
    </span>
  );
}

function AddItemInput({
  listId,
  parentId,
}: {
  listId: number;
  parentId: number | null;
}) {
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

  if (!adding) {
    return (
      <button
        className="ml-2 text-xs text-blue-500 hover:underline"
        onClick={() => setAdding(true)}
        type="button"
      >
        + Add Item
      </button>
    );
  }

  return (
    <Input
      className="ml-2 inline-block w-auto text-xs"
      value={text}
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onBlur={handleAdd}
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          await handleAdd();
        }
      }}
      placeholder="New item"
    />
  );
}

export default ListItemsTree;

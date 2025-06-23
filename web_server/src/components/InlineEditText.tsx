import React, { useState } from "react";
import { Input } from "@/components/ui/input";

interface InlineEditTextProps {
  value: string;
  onSave: (v: string) => void | Promise<void>;
  checked?: boolean;
}

export function InlineEditText({
  value,
  onSave,
  checked,
}: InlineEditTextProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  const handleSubmit = async () => {
    setEditing(false);
    if (text.trim() && text !== value) {
      await onSave(text.trim());
    }
  };

  const handleBlur = () => {
    setEditing(false);
  };

  return editing ? (
    <Input
      className="inline-block w-auto text-sm"
      value={text}
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onKeyDown={async (e) => {
        if (e.key === "Enter") {
          await handleSubmit();
        }
      }}
    />
  ) : (
    <span
      className={`cursor-pointer text-md hover:underline text-center flex flex-row items-center ${
        checked ? "line-through" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setEditing(true);
      }}
    >
      {value}
    </span>
  );
}

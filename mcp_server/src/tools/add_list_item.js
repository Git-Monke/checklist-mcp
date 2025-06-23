/**
 * Add List Item Tool
 *
 * Tool for adding a new item to an existing list with support for nesting
 */

import { z } from "zod";

/**
 * Add list item tool definition
 * @param {Function} dbRequest - Database request helper function
 * @returns {Object} Tool definition object
 */
export function createAddListItemTool(dbRequest) {
  return {
    name: "add_list_item",
    definition: {
      title: "Add Item to List",
      description: "Add a new item to an existing list",
      inputSchema: {
        list_id: z.number().describe("The ID of the list to add the item to"),
        text: z.string().describe("The text content of the new item"),
        parent_id: z
          .number()
          .nullable()
          .optional()
          .describe("Optional ID of parent item (for nested items)"),
        checked: z
          .boolean()
          .default(false)
          .describe("Whether the item should be marked as completed"),
      },
    },
    handler: async ({ list_id, text, parent_id = null, checked = false }) => {
      try {
        const newItem = await dbRequest(`/lists/${list_id}/items`, {
          method: "POST",
          body: JSON.stringify({ text, parent_id, checked }),
        });

        const parentText = parent_id
          ? ` as a sub-item of item ${parent_id}`
          : "";
        const statusText = checked ? " (marked as completed)" : "";

        return {
          content: [
            {
              type: "text",
              text: `Successfully added item "${newItem.text}" to list ${list_id}${parentText}${statusText} (Item ID: ${newItem.id})`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error adding item: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

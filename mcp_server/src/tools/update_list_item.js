/**
 * Update List Item Tool
 *
 * Tool for updating an existing list item's text or completion status
 */

import { z } from "zod";

/**
 * Update list item tool definition
 * @param {Function} dbRequest - Database request helper function
 * @returns {Object} Tool definition object
 */
export function createUpdateListItemTool(dbRequest) {
  return {
    name: "update_list_item",
    definition: {
      title: "Update List Item",
      description: "Update an existing list item's text or completion status",
      inputSchema: {
        list_id: z.number().describe("The ID of the list containing the item"),
        item_id: z.number().describe("The ID of the item to update"),
        text: z
          .string()
          .optional()
          .describe("New text content for the item (optional)"),
        checked: z
          .boolean()
          .optional()
          .describe("New completion status for the item (optional)"),
      },
    },
    handler: async ({ list_id, item_id, text, checked }) => {
      try {
        const updateData = {};
        if (text !== undefined) updateData.text = text;
        if (checked !== undefined) updateData.checked = checked;

        if (Object.keys(updateData).length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No updates specified. Please provide either text or checked status to update.",
              },
            ],
            isError: true,
          };
        }

        const updatedItem = await dbRequest(
          `/lists/${list_id}/items/${item_id}`,
          {
            method: "PUT",
            body: JSON.stringify(updateData),
          }
        );

        const changes = [];
        if (text !== undefined) changes.push(`text to \"${text}\"`);
        if (checked !== undefined)
          changes.push(`status to ${checked ? "completed" : "not completed"}`);

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated item ${item_id}: changed ${changes.join(
                " and "
              )}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating item: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

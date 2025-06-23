/**
 * Bulk Add List Items Tool
 *
 * Tool for adding multiple items to an existing list at once with support for nesting and error handling
 */

import { z } from "zod";

/**
 * Bulk add list items tool definition
 * @param {Function} dbRequest - Database request helper function
 * @returns {Object} Tool definition object
 */
export function createBulkAddListItemsTool(dbRequest) {
  return {
    name: "bulk_add_list_items",
    definition: {
      title: "Bulk Add Items to List",
      description: "Add multiple items to an existing list at once",
      inputSchema: {
        list_id: z.number().describe("The ID of the list to add items to"),
        items: z
          .array(
            z.object({
              text: z.string().describe("The text content of the item"),
              parent_id: z
                .number()
                .nullable()
                .optional()
                .describe("Optional ID of parent item (for nested items)"),
              checked: z
                .boolean()
                .default(false)
                .describe("Whether the item should be marked as completed"),
            })
          )
          .describe("Array of items to add"),
      },
    },
    handler: async ({ list_id, items }) => {
      try {
        const results = [];
        const errors = [];

        for (const item of items) {
          try {
            const newItem = await dbRequest(`/lists/${list_id}/items`, {
              method: "POST",
              body: JSON.stringify({
                text: item.text,
                parent_id: item.parent_id || null,
                checked: item.checked || false,
              }),
            });

            const parentText = item.parent_id
              ? ` (nested under item ${item.parent_id})`
              : "";
            const statusText = item.checked ? " (completed)" : "";
            results.push(
              `✅ "${newItem.text}" (ID: ${newItem.id})${parentText}${statusText}`
            );
          } catch (error) {
            errors.push(`❌ Failed to add "${item.text}": ${error.message}`);
          }
        }

        const successCount = results.length;
        const errorCount = errors.length;
        const totalCount = items.length;

        let responseText = `Bulk add completed: ${successCount}/${totalCount} items added successfully\n\n`;

        if (results.length > 0) {
          responseText +=
            "✅ Successfully added:\n" + results.join("\n") + "\n\n";
        }

        if (errors.length > 0) {
          responseText += "❌ Errors:\n" + errors.join("\n");
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
          isError: errorCount > 0,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error during bulk add: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Delete List Item Tool
 *
 * Tool for deleting an item from a list
 */

import { z } from "zod";

/**
 * Delete list item tool definition
 * @param {Function} dbRequest - Database request helper function
 * @returns {Object} Tool definition object
 */
export function createDeleteListItemTool(dbRequest) {
  return {
    name: "delete_list_item",
    definition: {
      title: "Delete List Item",
      description: "Delete an item from a list",
      inputSchema: {
        list_id: z.number().describe("The ID of the list containing the item"),
        item_id: z.number().describe("The ID of the item to delete"),
      },
    },
    handler: async ({ list_id, item_id }) => {
      try {
        await dbRequest(`/lists/${list_id}/items/${item_id}`, {
          method: "DELETE",
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted item ${item_id} from list ${list_id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting item: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

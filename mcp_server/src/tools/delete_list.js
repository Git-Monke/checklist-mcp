/**
 * Delete List Tool
 *
 * Tool for deleting an entire list and all its items
 */

import { z } from "zod";

/**
 * Delete list tool definition
 * @param {Function} dbRequest - Database request helper function
 * @returns {Object} Tool definition object
 */
export function createDeleteListTool(dbRequest) {
  return {
    name: "delete_list",
    definition: {
      title: "Delete List",
      description: "Delete an entire list and all its items",
      inputSchema: {
        list_id: z.number().describe("The ID of the list to delete"),
      },
    },
    handler: async ({ list_id }) => {
      try {
        await dbRequest(`/lists/${list_id}`, {
          method: "DELETE",
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully deleted list ${list_id} and all its items`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting list: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

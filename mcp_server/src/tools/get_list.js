/**
 * Get List Tool
 *
 * Tool for retrieving a specific list with all its items and hierarchy
 */

import { z } from "zod";

/**
 * Get list tool definition
 * @param {Function} dbRequest - Database request helper function
 * @param {Function} formatItems - Utility function to format items hierarchically
 * @returns {Object} Tool definition object
 */
export function createGetListTool(dbRequest, formatItems) {
  return {
    name: "get_list",
    definition: {
      title: "Get List Details",
      description: "Retrieve a specific list with all its items and hierarchy",
      inputSchema: {
        list_id: z.number().describe("The ID of the list to retrieve"),
      },
    },
    handler: async ({ list_id }) => {
      try {
        const list = await dbRequest(`/lists/${list_id}`);

        const itemsText =
          list.items && list.items.length > 0
            ? formatItems(list.items)
            : "No items yet";

        return {
          content: [
            {
              type: "text",
              text:
                `**${list.name}**\n` +
                `ID: ${list.id}\n` +
                `Created: ${list.created_at}\n` +
                `Last Updated: ${list.updated_at}\n\n` +
                `**Items:**\n${itemsText}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving list: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

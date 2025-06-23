/**
 * Get All Lists Tool
 *
 * Tool for retrieving all checklist lists with their basic information
 */

import { z } from "zod";

/**
 * Get all lists tool definition
 * @param {Function} dbRequest - Database request helper function
 * @returns {Object} Tool definition object
 */
export function createGetAllListsTool(dbRequest) {
  return {
    name: "get_all_lists",
    definition: {
      title: "Get All Lists",
      description: "Retrieve all checklist lists with their basic information",
      inputSchema: {},
    },
    handler: async () => {
      try {
        const lists = await dbRequest("/lists");
        return {
          content: [
            {
              type: "text",
              text:
                `Found ${lists.length} lists:\n\n` +
                lists
                  .map(
                    (list) =>
                      `• ${list.name} (ID: ${list.id}, Created: ${list.created_at})`
                  )
                  .join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving lists: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

/**
 * Create List Tool
 *
 * Tool for creating a new checklist with the specified name
 */

import { z } from "zod";

/**
 * Create list tool definition
 * @param {Function} dbRequest - Database request helper function
 * @returns {Object} Tool definition object
 */
export function createCreateListTool(dbRequest) {
  return {
    name: "create_list",
    definition: {
      title: "Create New List",
      description: "Create a new checklist with the specified name",
      inputSchema: {
        name: z.string().describe("The name of the new list"),
      },
    },
    handler: async ({ name }) => {
      try {
        const newList = await dbRequest("/lists", {
          method: "POST",
          body: JSON.stringify({ name }),
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully created list "${newList.name}" with ID: ${newList.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating list: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

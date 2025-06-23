/**
 * Find List Item Tool
 *
 * Tool for searching for items by regex and getting their IDs across all lists
 */

import { z } from "zod";

/**
 * Find list item tool definition
 * @param {Function} dbRequest - Database request helper function
 * @param {Function} flattenItems - Utility function to flatten nested items
 * @returns {Object} Tool definition object
 */
export function createFindListItemTool(dbRequest, flattenItems) {
  return {
    name: "find_list_item",
    definition: {
      title: "Find List Item (Regex, All Lists)",
      description:
        "Find a list item by searching all lists using a regex and get its ID",
      inputSchema: {
        search_regex: z
          .string()
          .describe(
            "Regex pattern to search for in item names (case-insensitive)"
          ),
      },
    },
    handler: async ({ search_regex }) => {
      try {
        const lists = await dbRequest("/lists");
        let allItems = [];
        for (const list of lists) {
          // Fetch full list with items
          const fullList = await dbRequest(`/lists/${list.id}`);
          const items = flattenItems(fullList.items || []);
          // Attach list name to each item
          allItems.push(
            ...items.map((item) => ({ ...item, listName: list.name }))
          );
        }

        let regex;
        try {
          regex = new RegExp(search_regex, "i");
        } catch (e) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid regex: ${e.message}`,
              },
            ],
            isError: true,
          };
        }

        // Find items that match the regex
        const matchingItems = allItems.filter((item) => regex.test(item.text));

        if (matchingItems.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No items found matching /${search_regex}/ in any list.`,
              },
            ],
          };
        }

        let resultText = `Found ${matchingItems.length} item(s) matching /${search_regex}/ across all lists:\n\n`;

        matchingItems.forEach((item, index) => {
          const status = item.checked ? "☑️" : "☐";
          const parentInfo = item.parent_id
            ? ` (nested under item ${item.parent_id})`
            : "";
          resultText += `${index + 1}. [${item.listName}] ${status} "${
            item.text
          }" (ID: ${item.id})${parentInfo}\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error finding item: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}

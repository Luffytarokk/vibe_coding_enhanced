#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AidlManager } from "./src/aidl-manager.js";

// Create the MCP server
const server = new McpServer({
  name: "vibe_coding_enhanced",
  version: "1.0.0"
});

// Initialize AIDL manager
const aidlManager = new AidlManager();

// Error codes
const ErrorCodes = {
  E_NOT_FOUND: "E_NOT_FOUND",
  E_EXISTS: "E_EXISTS", 
  E_INVALID: "E_INVALID",
  E_CONFLICT: "E_CONFLICT",
  E_IO: "E_IO"
};

// Helper function to handle errors consistently
function handleError(error, defaultCode = ErrorCodes.E_IO) {
  console.error("AIDL Error:", error);
  
  if (error.code) {
    return {
      ok: false,
      error: error.code,
      message: error.message
    };
  }
  
  return {
    ok: false,
    error: defaultCode,
    message: error.message || "An unexpected error occurred"
  };
}

// 1. aidl_create - Create a new AIDL
server.registerTool(
  "aidl_create",
  {
    title: "Create AIDL",
    description: "Create a new Agent Important Decision Log entry",
    inputSchema: {
      title: z.string().describe("One-sentence summary of the decision (preferably starting with a verb)"),
      id: z.string().regex(/^[a-z][a-z0-9_]{2,64}$/).describe("Unique identifier: lowercase letters, numbers, underscores only"),
      context: z.string().describe("Business goals, current situation, constraints, and triggering issues"),
      decision: z.string().describe("What was chosen, scope, non-goals, and boundaries"),
      rationale: z.string().describe("Key drivers and trade-offs behind the decision"),
      assumptions: z.array(z.string()).describe("Assumptions this decision is based on"),
      risks: z.record(z.object({
        probability: z.enum(["LOW", "MED", "HIGH"]),
        impact: z.enum(["LOW", "MED", "HIGH"]),
        mitigation: z.string()
      })).describe("Risk assessment with mitigation strategies"),
      cost: z.object({
        one_off: z.array(z.string()).describe("One-time costs"),
        ongoing: z.array(z.string()).describe("Ongoing costs")
      }),
      consequences: z.object({
        positive: z.array(z.string()).describe("Positive outcomes"),
        negative: z.array(z.string()).describe("Negative impacts or trade-offs")
      }),
      expected_result: z.array(z.string()).describe("Success criteria and acceptance standards")
    }
  },
  async (params) => {
    try {
      const result = await aidlManager.create(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// 2. aidl_get - Get AIDL by ID
server.registerTool(
  "aidl_get",
  {
    title: "Get AIDL",
    description: "Retrieve an AIDL by its ID",
    inputSchema: {
      id: z.string().describe("AIDL identifier")
    }
  },
  async ({ id }) => {
    try {
      const result = await aidlManager.get(id);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// 3. aidl_search - Search AIDLs by title
server.registerTool(
  "aidl_search",
  {
    title: "Search AIDL",
    description: "Search AIDLs by title (case-insensitive)",
    inputSchema: {
      keyword: z.string().describe("Search keyword for title matching")
    }
  },
  async ({ keyword }) => {
    try {
      const result = await aidlManager.search(keyword);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// 4. aidl_detail_search - Full-text search
server.registerTool(
  "aidl_detail_search",
  {
    title: "Detail Search AIDL",
    description: "Full-text search across all AIDL content",
    inputSchema: {
      keyword: z.string().describe("Search keyword for full-text matching")
    }
  },
  async ({ keyword }) => {
    try {
      const result = await aidlManager.detailSearch(keyword);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// 5. aidl_update_status - Update AIDL status
server.registerTool(
  "aidl_update_status",
  {
    title: "Update AIDL Status",
    description: "Update the status of an AIDL (cannot directly set to SUPERSEDED)",
    inputSchema: {
      id: z.string().describe("AIDL identifier"),
      status: z.enum(["PROPOSED", "ACCEPTED", "REJECTED", "FINISHED", "FAILED"]).describe("New status")
    }
  },
  async ({ id, status }) => {
    try {
      const result = await aidlManager.updateStatus(id, status);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// 6. aidl_supersede - Mark AIDL as superseded
server.registerTool(
  "aidl_supersede",
  {
    title: "Supersede AIDL",
    description: "Mark an AIDL as superseded by another",
    inputSchema: {
      id: z.string().describe("AIDL identifier to supersede"),
      superseded_by: z.string().describe("ID or ADR number of the superseding AIDL")
    }
  },
  async ({ id, superseded_by }) => {
    try {
      const result = await aidlManager.supersede(id, superseded_by);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// 7. aidl_update - Update AIDL fields
server.registerTool(
  "aidl_update",
  {
    title: "Update AIDL",
    description: "Update editable fields of an AIDL",
    inputSchema: {
      id: z.string().describe("AIDL identifier"),
      title: z.string().optional(),
      context: z.string().optional(),
      decision: z.string().optional(),
      rationale: z.string().optional(),
      assumptions: z.array(z.string()).optional(),
      risks: z.record(z.object({
        probability: z.enum(["LOW", "MED", "HIGH"]),
        impact: z.enum(["LOW", "MED", "HIGH"]),
        mitigation: z.string()
      })).optional(),
      cost: z.object({
        one_off: z.array(z.string()),
        ongoing: z.array(z.string())
      }).optional(),
      consequences: z.object({
        positive: z.array(z.string()),
        negative: z.array(z.string())
      }).optional(),
      expected_result: z.array(z.string()).optional()
    }
  },
  async (params) => {
    try {
      const result = await aidlManager.update(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// 8. aidl_list - List AIDLs with filtering and pagination
server.registerTool(
  "aidl_list",
  {
    title: "List AIDLs",
    description: "List AIDLs with optional filtering and pagination",
    inputSchema: {
      status: z.enum(["PROPOSED", "ACCEPTED", "REJECTED", "FINISHED", "FAILED", "SUPERSEDED"]).optional(),
      from: z.string().optional().describe("Start date (ISO 8601)"),
      to: z.string().optional().describe("End date (ISO 8601)"),
      page: z.number().int().min(1).default(1).describe("Page number"),
      page_size: z.number().int().min(1).max(100).default(20).describe("Items per page")
    }
  },
  async (params) => {
    try {
      const result = await aidlManager.list(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      const errorResult = handleError(error);
      return {
        content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }],
        isError: true
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AIDL MCP Server running...");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
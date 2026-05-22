import { OllamaApiTool } from "../ollama/types";
import { McpServerTool } from "./types";

/**
 * Convert Mcp Server Tools format into Ollama Tools.
 * @param tools - Mcp Server Tools.
 */
export function ConvertMcpToolsToOllamaTools(tools: McpServerTool[]): OllamaApiTool[] {
  return tools.map((tool): OllamaApiTool => {
    const tO = <OllamaApiTool>{
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: {
          type: "object",
          required: tool.inputSchema.required || [],
          properties: {},
        },
      },
    };
    return tO;
  });
}

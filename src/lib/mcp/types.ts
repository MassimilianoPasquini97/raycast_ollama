import { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio";

// Mcp Server Config.
export interface McpServerConfig {
  mcpServers: McpServerParams;
}

// Mcp Server Parameters. Only stdio transport supported.
export interface McpServerParams {
  [name: string]: StdioServerParameters;
}

export interface McpServerTool {
  name: string;
  description?: string;
  inputSchema: any;
}

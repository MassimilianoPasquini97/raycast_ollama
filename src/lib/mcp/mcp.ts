import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { McpServerTool } from "./types";
import { execSync } from "child_process";
import os from "os";
import { OllamaApiChatMessageToolCall, OllamaApiTool } from "../ollama/types";
import { ConvertMcpToolsToOllamaTools } from "./utils";

export class McpClient {
  private _client: Client;
  private _transport: StdioClientTransport | SSEClientTransport;

  private _tools: McpServerTool[] | undefined;

  constructor(config: StdioServerParameters) {
    this._client = new Client(
      {
        name: "raycast-extension-ollama",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this._initEnvs();
    this._initPaths();
    this._transport = new StdioClientTransport(config);
  }

  /*
   * Add user defined envs on process.env.
   */
  private _initEnvs(): void {
    const shell = os.userInfo().shell || "/bin/sh";
    try {
      execSync(`LC_ALL=en_US.UTF-8 ${shell} -L -i -c 'printenv'`, { encoding: "utf8" })
        .split("\n")
        .forEach((l) => {
          const [k, v] = l.split("=");
          if (k && v) {
            process.env[k] = v;
          }
        });
    } catch (e) {
      console.error("Error retrieving user shell envs:", e);
    }
  }

  /*
   * Add user difined paths on process.env.PATH.
   */
  private _initPaths(): void {
    const shell = os.userInfo().shell || "/bin/sh";
    try {
      const path = execSync(`${shell} -l -c 'echo $PATH'`).toString().trim();
      process.env.PATH = path;
    } catch (e) {
      console.error("Error retrieving user shell paths:", e);
    }
  }

  /**
   * Get Available Tools from Mcp Server.
   * @param use_cache - disable tools cache.
   */
  async GetTools(use_cache = true): Promise<McpServerTool[]> {
    if (use_cache && this._tools) return this._tools;

    await this._client.connect(this._transport);

    try {
      const tools = await this._client.listTools();
      this._tools = tools.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        };
      });
      return this._tools;
    } finally {
      this._client.close();
    }
  }

  /**
   * Get Available Tools from Mcp Server in Ollama Tools Format.
   * @param use_cache - disable tools cache.
   */
  async GetToolsForOllama(use_cache = true): Promise<OllamaApiTool[]> {
    const tools = await this.GetTools(use_cache);
    return ConvertMcpToolsToOllamaTools(tools);
  }

  /**
   * Call Tools on Mcp Server.
   * @param tools - Ollama Message Tool Calls.
   */
  async CallToolsForOllama(tools: OllamaApiChatMessageToolCall[]): Promise<any[]> {
    await this._client.connect(this._transport);

    try {
      return await Promise.all(
        tools.map(async (tool): Promise<any> => {
          const result = await this._client.callTool(tool.function);
          return result.content;
        })
      );
    } finally {
      this._client.close();
    }
  }
}

import { useEffect, useRef, useState } from "react";
import { webmcpManifest, runWebmcpTool, type WebMCPTool } from "@/features/agent/webmcp";
import type { ParamDef } from "@/features/data/ops";
import type { AgentBoardApi } from "@/features/agent/chat-agent";

const READONLY = new Set(["get_data", "transform_data", "inspect_data", "board.get_state"]);

/** ParamDefs → WebMCP JSON Schema for registerTool. Pure — unit-tested. */
export function toolInputSchema(params: ParamDef[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const p of params) {
    const prop: Record<string, unknown> = { description: p.description ?? p.name };
    prop.type = p.type === "json" || p.type === "dataset" ? "object" : p.type;
    if (p.enum) prop.enum = p.enum;
    if (p.default !== undefined) prop.default = p.default;
    properties[p.name] = prop;
    if (p.required) required.push(p.name);
  }
  return { type: "object", properties, required };
}

async function registerTool(t: WebMCPTool, api: () => AgentBoardApi): Promise<void> {
  const mc = typeof document !== "undefined" ? document.modelContext : undefined;
  if (!mc || typeof mc.registerTool !== "function") return;
  await mc.registerTool({
    name: t.name,
    description: t.description,
    inputSchema: toolInputSchema(t.params),
    ...(READONLY.has(t.name) ? { annotations: { readOnlyHint: true } } : {}),
    execute: async (input: unknown) => {
      const args = (input ?? {}) as Record<string, unknown>;
      const r = await runWebmcpTool(t.name, args, api());
      return { ok: r.ok, reply: r.reply };
    },
  });
}

let registered = false;

/**
 * Expose the board to external agents via the WebMCP browser bridge
 * (`document.modelContext`, polyfilled by @mcp-b/global where missing).
 * Registers once per page load; safe to call from multiple components.
 * Resolves { supported } for a UI indicator — in-app chat works regardless.
 */
export function useWebMCP(api: AgentBoardApi): { supported: boolean } {
  const [supported, setSupported] = useState(registered);
  const apiRef = useRef(api);
  apiRef.current = api;

  useEffect(() => {
    if (registered) {
      setSupported(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { initializeWebModelContext } = await import("@mcp-b/global");
        initializeWebModelContext();
        const mc = document.modelContext;
        if (typeof mc?.registerTool !== "function") return;
        const getApi = () => apiRef.current;
        for (const t of webmcpManifest().tools) {
          await registerTool(t, getApi);
        }
        registered = true;
        if (!cancelled) setSupported(true);
      } catch {
        // No bridge (old browser, blocked polyfill) — chat still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { supported };
}

export { handleChatMessage, chartKindFor } from "@/features/agent/chat-agent";
export type { AgentBoardApi, ChartKind, ChatReply } from "@/features/agent/chat-agent";
export { webmcpManifest, runWebmcpTool } from "@/features/agent/webmcp";
export type { WebMCPManifest, WebMCPTool, ToolResult } from "@/features/agent/webmcp";
export { ChatPanel } from "@/features/agent/chat-panel";
export { useAgentBoardApi } from "@/features/agent/use-agent-api";
export { useWebMCP, toolInputSchema } from "@/features/agent/use-webmcp";
export { runInline, runOp, opSpecs, opNames } from "@/features/data/ops";

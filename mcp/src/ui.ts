import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";

const require = createRequire(import.meta.url);

export const BOARD_UI_URI = "ui://microboard/board.html";

let cachedHtml: string | undefined;

function exportMap(source: string): Map<string, string> {
  const match = /export\s*\{([^}]*)\}\s*;?\s*$/.exec(source);
  if (!match) throw new Error("Could not read the MCP Apps bundle export map.");
  const entries = new Map<string, string>();
  for (const entry of match[1].split(",")) {
    const [local, exported = local] = entry.trim().split(/\s+as\s+/);
    if (local) entries.set(exported, local);
  }
  return entries;
}

function exported(entries: Map<string, string>, name: string): string | undefined {
  return entries.get(name);
}

function safeScript(source: string): string {
  return source.replace(/<\/script/gi, "<\\/script");
}

export function boardUiHtml(): string {
  if (cachedHtml) return cachedHtml;

  const bundlePath = require.resolve("@modelcontextprotocol/ext-apps/app-with-deps");
  const bundle = readFileSync(bundlePath, "utf8");
  const view = readFileSync(new URL("../ui/view.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("../ui/view.css", import.meta.url), "utf8");

  const exportMatch = /export\s*\{([^}]*)\}\s*;?\s*$/.exec(bundle);
  if (!exportMatch) throw new Error("Could not read the MCP Apps bundle export map.");
  const entries = exportMap(bundle);
  const app = exported(entries, "App");
  const transport = exported(entries, "PostMessageTransport");
  if (!app || !transport) throw new Error("MCP Apps bundle is missing App or PostMessageTransport.");

  const theme = exported(entries, "applyDocumentTheme");
  const styles = exported(entries, "applyHostStyleVariables");

  const module = [
    safeScript(bundle.replace(exportMatch[0], "")),
    `const MicroboardApp = ${app};`,
    `const MicroboardTransport = ${transport};`,
    `const MicroboardTheme = ${theme ?? "() => {}"};`,
    `const MicroboardStyles = ${styles ?? "() => {}"};`,
    safeScript(`(() => {\n${view}\n})();`),
  ].join("\n");

  cachedHtml = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Microboard</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<div id="status" role="status" aria-live="polite"></div>
<noscript>Microboard needs JavaScript to show the board.</noscript>
<script type="module">
${module}
</script>
</body>
</html>`;

  return cachedHtml;
}

export function registerBoardUi(server: McpServer): void {
  registerAppResource(
    server,
    "Microboard board",
    BOARD_UI_URI,
    {
      description:
        "Interactive Microboard surface: inspect the recipe, approve or reject proposals, and lock widgets.",
      _meta: { ui: { prefersBorder: true } },
    },
    async () => ({
      contents: [
        {
          uri: BOARD_UI_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: boardUiHtml(),
          _meta: { ui: { prefersBorder: true } },
        },
      ],
    })
  );
}

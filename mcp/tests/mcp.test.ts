import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "../src/server";
import { clearProposals } from "../src/proposals";

let dir = "";
let client: Client;
let server: ReturnType<typeof createServer>;

function text(result: CallToolResult): string {
  return result.content
    .filter((item): item is { type: "text"; text: string } => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

async function call(name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> {
  return (await client.callTool({ name, arguments: args })) as CallToolResult;
}

function parse(result: CallToolResult): Record<string, any> {
  return JSON.parse(text(result));
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "microboard-mcp-"));
  process.env.MICROBOARD_BOARD_PATH = join(dir, "board.json");
  process.env.MICROBOARD_EXPORT_DIR = join(dir, "exports");
  clearProposals();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  server = createServer();
  await server.connect(serverTransport);
  client = new Client({ name: "microboard-test", version: "1.0.0" });
  await client.connect(clientTransport);
});

afterAll(async () => {
  await client.close();
  await server.close();
  await rm(dir, { recursive: true, force: true });
  delete process.env.MICROBOARD_BOARD_PATH;
  delete process.env.MICROBOARD_EXPORT_DIR;
});

describe("MCP tools", () => {
  test("load, inspect, transform, widget, export", async () => {
    const load = parse(await call("load_data", { type: "sample", title: "Signups" }));
    expect(load.ok).toBe(true);
    expect(load.rows).toBe(12);
    expect(load.columns).toContain("visitors");

    const inspect = parse(await call("inspect_data", { sample: 2 }));
    expect(inspect.rows).toBe(12);
    expect(inspect.sample).toHaveLength(2);

    const proposal = parse(
      await call("propose_transform", {
        type: "groupBy",
        params: { column: "channel", agg: "sum", target: "visitors" },
      })
    );
    expect(proposal.kind).toBe("transform");
    expect(proposal.preview.rowsAfter).toBe(3);

    const applied = parse(
      await call("apply_transform", {
        proposalId: proposal.proposalId,
        expectedVersion: proposal.baseVersion,
      })
    );
    expect(applied.ok).toBe(true);
    expect(applied.rows).toBe(3);

    const widget = parse(
      await call("propose_widget", { type: "bar", x: "channel", y: "sum_visitors", title: "Visitors" })
    );
    expect(widget.kind).toBe("widget");

    const added = parse(
      await call("add_widget", { proposalId: widget.proposalId, expectedVersion: widget.baseVersion })
    );
    expect(added.widget.type).toBe("bar");

    const state = parse(await call("get_board_state", { includeRows: false, sample: 1 }));
    expect(state.summary.widgets).toBe(1);
    expect(state.board.data.cleaned).toHaveLength(1);

    const json = parse(await call("export_board", { format: "json" }));
    expect(json.format).toBe("json");
    expect(json.bytes).toBeGreaterThan(100);

    const html = parse(await call("export_board", { format: "html" }));
    expect(html.format).toBe("html");
    expect(html.bytes).toBeGreaterThan(10_000);

    const png = await call("export_board", { format: "png" });
    expect(png.isError).toBeFalsy();
    expect(png.content[0]?.type).toBe("image");
    if (png.content[0]?.type === "image") {
      expect(png.content[0].data.length).toBeGreaterThan(1_000);
    }

    const chart = await call("render_chart", { widgetId: added.widget.id, format: "png" });
    expect(chart.content[0]?.type).toBe("image");
  }, 60_000);

  test("stale proposals and writes fail closed", async () => {
    const state = parse(await call("get_board_state", { includeRows: false }));
    const stale = state.summary.version + 5;
    const proposal = parse(
      await call("propose_transform", { type: "sort", params: { column: "sum_visitors", dir: "desc" } })
    );
    const failed = await call("apply_transform", {
      proposalId: proposal.proposalId,
      expectedVersion: stale,
    });
    expect(failed.isError).toBe(true);
    expect(text(failed)).toContain("Version conflict");
  });

  test("locked widgets cannot be updated", async () => {
    const state = parse(await call("get_board_state", { includeRows: false }));
    const widgetId = Object.keys(state.board.widgets)[0];
    const locked = parse(
      await call("lock_widget", { widgetId, expectedVersion: state.summary.version, locked: true })
    );
    expect(locked.locked).toBe(true);

    const update = await call("update_widget", {
      widgetId,
      expectedVersion: locked.version,
      title: "Nope",
    });
    expect(update.isError).toBe(true);
    expect(text(update)).toContain("locked");
  });
});
